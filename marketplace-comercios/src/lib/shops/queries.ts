import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";

export const PLAN_LIMITS_CACHE_TAG = "plan-limits";

interface PlanLimitsRow {
  plan_id: string | null;
  max_products_service: number | null;
  max_products_product: number | null;
  max_images: number;
  max_variants: number;
  max_gym_members: number | null;
}

interface FreePlanScope {
  id: string;
  applies_to: string;
  category_id: string | null;
}

interface PlanLimitsData {
  // Array en vez de Map: unstable_cache serializa el resultado a JSON para
  // persistirlo en caché, y un Map no sobrevive esa serialización (queda un
  // objeto plano sin .get/.set, lo que rompía en producción con
  // "byPlanId.get is not a function").
  limitRows: PlanLimitsRow[];
  defaultLimits: PlanLimitsRow | null;
  // Planes free genéricos (sin categoría) por rubro; los planes free
  // scopeados a una categoría se resuelven vía `freePlans`.
  freeServicePlanId: string | null;
  freeProductPlanId: string | null;
  freePlans: FreePlanScope[];
}

// Los límites por plan viven en la tabla plan_limits en Supabase (única
// fuente de verdad, también consumida por la futura app mobile), con una
// fila por plan_id real de subscription_plans (más una fila "por defecto"
// con plan_id NULL usada como fallback para planes pagos sin fila propia).
// Se cachean brevemente por request/despliegue para no golpear la DB en cada
// validación de límite; revalidatePlanLimitsCache() invalida esto cuando el
// superadmin edita los valores desde el panel de admin.
const getPlanLimitsData = unstable_cache(
  async (): Promise<PlanLimitsData> => {
    const supabase = createPublicClient();

    const [
      { data: limitRows, error: limitRowsError },
      { data: freePlans, error: freePlansError },
    ] = await Promise.all([
      supabase
        .from("plan_limits")
        .select(
          "plan_id, max_products_service, max_products_product, max_images, max_variants, max_gym_members",
        ),
      supabase
        .from("subscription_plans")
        .select("id, applies_to, category_id")
        .eq("price", 0)
        .eq("is_active", true),
    ]);

    if (limitRowsError) {
      console.error("getPlanLimitsData: fallo al traer plan_limits", {
        error: limitRowsError,
      });
    }
    if (freePlansError) {
      console.error("getPlanLimitsData: fallo al traer planes gratuitos", {
        error: freePlansError,
      });
    }

    const rowsByPlan: PlanLimitsRow[] = [];
    let defaultLimits: PlanLimitsRow | null = null;

    for (const row of limitRows ?? []) {
      if (row.plan_id) {
        rowsByPlan.push(row);
      } else {
        defaultLimits = row;
      }
    }

    const freePlanScopes: FreePlanScope[] = (freePlans ?? []).map((plan) => ({
      id: plan.id,
      applies_to: plan.applies_to,
      category_id: plan.category_id,
    }));

    let freeServicePlanId: string | null = null;
    let freeProductPlanId: string | null = null;

    // Los IDs "genéricos" salen solo de planes free sin categoría; los free
    // scopeados a una categoría se resuelven aparte por category_id.
    for (const plan of freePlanScopes) {
      if (plan.category_id) continue;
      if (
        (plan.applies_to === "service" || plan.applies_to === "all") &&
        !freeServicePlanId
      ) {
        freeServicePlanId = plan.id;
      }
      if (
        (plan.applies_to === "product" || plan.applies_to === "all") &&
        !freeProductPlanId
      ) {
        freeProductPlanId = plan.id;
      }
    }

    return {
      limitRows: rowsByPlan,
      defaultLimits,
      freeServicePlanId,
      freeProductPlanId,
      freePlans: freePlanScopes,
    };
  },
  ["plan-limits"],
  { revalidate: 60, tags: [PLAN_LIMITS_CACHE_TAG] },
);

function resolveFreeLimits(
  data: PlanLimitsData,
  isService: boolean,
  categoryId?: string | null,
): PlanLimitsRow | null {
  // Un plan free scopeado a la categoría del comercio tiene prioridad sobre el
  // free genérico del rubro (Modelo B: free y pago por categoría).
  const categoryPlanId = categoryId
    ? (data.freePlans.find((p) => p.category_id === categoryId)?.id ?? null)
    : null;
  const planId =
    categoryPlanId ?? (isService ? data.freeServicePlanId : data.freeProductPlanId);
  const row = planId ? data.limitRows.find((r) => r.plan_id === planId) : undefined;
  return row ?? data.defaultLimits ?? null;
}

// Cualquier fila free sirve de base para límites que no distinguen rubro
// (imágenes, variantes); se prioriza la de "product" y se cae a "service" o
// a la fila por defecto.
function resolveAnyFreeLimits(data: PlanLimitsData): PlanLimitsRow | null {
  const planId = data.freeProductPlanId ?? data.freeServicePlanId;
  const row = planId ? data.limitRows.find((r) => r.plan_id === planId) : undefined;
  return row ?? data.defaultLimits ?? null;
}

// Centraliza la resolución del límite de productos del plan gratuito para
// un comercio, según su rubro (servicio o producto). Reemplaza el
// hardcodeo que existía en mi-tienda/page.tsx y mi-tienda/suscripcion/page.tsx.
export async function getFreeProductMax(
  isService: boolean,
  categoryId?: string | null,
): Promise<number | null> {
  const data = await getPlanLimitsData();
  const row = resolveFreeLimits(data, isService, categoryId);
  return isService
    ? (row?.max_products_service ?? null)
    : (row?.max_products_product ?? null);
}

// Cacheado por request: el layout de /mi-tienda y la page piden la tienda
// del usuario logueado por separado; sin esto son dos queries idénticas.
export const getMyShop = cache(async () => {
  const supabase = await createClient();

  const user = await getAuthUser();

  if (!user) return null;

  const { data: shop, error } = await supabase
    .from("shops")
    .select(
      `
      id, owner_id, category_id, name, slug, description, logo_url, cover_url,
      whatsapp_number, email, instagram_url, facebook_url, website_url, address, city,
      verification_status, verification_document_url, verified_by, verified_at,
      subscription_status, subscription_expires_at,
      is_active, is_paused, paused_reason, business_hours, accent_color,
      landing_banner, landing_services, landing_gallery, landing_video_url,
      profile_views, whatsapp_clicks, created_at, updated_at, deleted_at,
      categories ( slug )
    `,
    )
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("getMyShop: fallo al traer la tienda del usuario", {
      userId: user.id,
      error,
    });
  }

  return shop;
});

export async function getShopContactsSeries(shopId: string, days = 14) {
  const supabase = await createClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  since.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("shop_contacts")
    .select("created_at")
    .eq("shop_id", shopId)
    .gte("created_at", since.toISOString());

  if (error) {
    console.error("getShopContactsSeries: fallo al traer contactos de la tienda", {
      shopId,
      days,
      error,
    });
  }

  const counts = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const date = new Date(since);
    date.setDate(date.getDate() + i);
    counts.set(date.toISOString().slice(0, 10), 0);
  }

  for (const row of data ?? []) {
    const day = row.created_at.slice(0, 10);
    if (counts.has(day)) counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([date, count]) => ({
    date: new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "2-digit",
    }).format(new Date(date)),
    contactos: count,
  }));
}

export async function getMyPromotions(shopId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("shop_promotions")
    .select(
      "id, image_url, text, created_at, expires_at, text_position, text_size, text_color, bg_color, products ( id, name )",
    )
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) {
    if (error) {
      console.error("getMyPromotions: fallo al traer promociones de la tienda", {
        shopId,
        error,
      });
    }
    return [];
  }

  return data;
}

export const getActivePromotions = unstable_cache(
  async () => {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from("shop_promotions")
      .select(
        `
        id, image_url, text, expires_at, text_position, text_size, text_color, bg_color,
        shops ( id, name, slug, logo_url, whatsapp_number, verification_status, subscription_status ),
        products ( id, name )
      `,
      )
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(30);

    if (error || !data) {
      if (error) {
        console.error("getActivePromotions: fallo al traer promociones activas", {
          error,
        });
      }
      return [];
    }

    return data.filter((promo) => promo.shops !== null);
  },
  ["active-promotions"],
  { revalidate: 30 },
);

export interface MyShopProductsResult {
  products: {
    id: string;
    name: string;
    price: number | null;
    currency: string;
    is_active: boolean;
    is_featured: boolean;
    main_image: string | null;
    image_urls: string[];
    category_name: string | null;
  }[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getMyShopProducts(
  shopId: string,
  page = 1,
  pageSize = 24,
  search?: string,
): Promise<MyShopProductsResult> {
  const supabase = await createClient();

  const safePage = Math.max(1, page);
  const from = (safePage - 1) * pageSize;
  const to = safePage * pageSize - 1;
  const normalizedSearch = search?.trim();

  let query = supabase
    .from("products")
    .select(
      `
      id,
      name,
      price,
      currency,
      is_active,
      is_featured,
      product_images ( url ),
      categories ( name )
    `,
      { count: "exact" },
    )
    .eq("shop_id", shopId);

  if (normalizedSearch) {
    query = query.ilike("name", `%${normalizedSearch}%`);
  }

  // La grilla solo muestra la imagen principal, así que se limita el join
  // embebido a la de menor sort_order en vez de traer todas las imágenes de
  // cada producto (24 productos x N imágenes) y ordenarlas en JS.
  const {
    data: products,
    error,
    count,
  } = await query
    .order("sort_order", { referencedTable: "product_images", ascending: true })
    .limit(1, { referencedTable: "product_images" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error || !products) {
    if (error) {
      console.error("getMyShopProducts: fallo al traer productos de la tienda", {
        shopId,
        page: safePage,
        pageSize,
        search: normalizedSearch,
        error,
      });
    }
    return {
      products: [],
      totalCount: 0,
      page: safePage,
      pageSize,
      totalPages: 1,
    };
  }

  const totalCount = count ?? products.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const mapped = products.map((product) => {
    // product_images ya viene ordenado por sort_order y limitado a 1 desde la
    // query (la imagen principal), así que no hace falta ordenar en JS.
    const images = product.product_images ?? [];

    return {
      id: product.id,
      name: product.name,
      price: product.price,
      currency: product.currency,
      is_active: product.is_active,
      is_featured: product.is_featured,
      main_image: images[0]?.url ?? null,
      image_urls: images.map((image) => image.url),
      category_name: product.categories?.name ?? null,
    };
  });

  return { products: mapped, totalCount, page: safePage, pageSize, totalPages };
}

export async function getActiveCategories() {
  // Cliente público (sin cookies): las categorías activas son data pública
  // —el feed ya las lee así— y esto permite que /comercios se sirva estática.
  const supabase = createPublicClient();

  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name, slug, is_service")
    .eq("is_active", true)
    .is("parent_id", null)
    .order("name", { ascending: true })
    .limit(100);

  if (error) {
    console.error("getActiveCategories: fallo al traer categorías activas", {
      error,
    });
  }

  // "Tienda de ropa" va primero en el chip de rubros (pedido de negocio);
  // el resto mantiene el orden alfabético.
  return [...(categories ?? [])].sort((a, b) => {
    if (a.slug === "tienda-de-ropa") return -1;
    if (b.slug === "tienda-de-ropa") return 1;
    return 0;
  });
}

export async function getCategoryAttributes(categoryId: string | null) {
  if (!categoryId) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("category_attributes")
    .select("id, key, label, type, options")
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getCategoryAttributes: fallo al traer atributos de la categoría", {
      categoryId,
      error,
    });
  }

  return data ?? [];
}

export async function getProductAttributeValues(productId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("product_attribute_values")
    .select("attribute_id, value, category_attributes ( key, label, type )")
    .eq("product_id", productId);

  if (error) {
    console.error("getProductAttributeValues: fallo al traer valores de atributos del producto", {
      productId,
      error,
    });
  }

  return data ?? [];
}

export async function getSubcategories(parentId: string | null) {
  if (!parentId) return [];

  const supabase = await createClient();

  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name")
    .eq("is_active", true)
    .eq("parent_id", parentId)
    .order("name", { ascending: true })
    .limit(100);

  if (error) {
    console.error("getSubcategories: fallo al traer subcategorías", {
      parentId,
      error,
    });
  }

  return categories ?? [];
}

export async function getMyProduct(productId: string) {
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select(
      `
      id,
      shop_id,
      name,
      description,
      price,
      currency,
      category_id,
      is_active,
      video_url,
      product_images ( id, url, sort_order ),
      product_variants ( id, name, price, sort_order )
    `,
    )
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    console.error("getMyProduct: fallo al traer el producto", {
      productId,
      error,
    });
  }

  return product;
}

export const getShopBySlug = unstable_cache(
  async (slug: string) => {
    const supabase = createPublicClient();

    const { data: shop, error } = await supabase
      .from("shops")
      .select(
        `
        id,
        name,
        slug,
        description,
        logo_url,
        cover_url,
        whatsapp_number,
        instagram_url,
        facebook_url,
        website_url,
        address,
        city,
        category_id,
        verification_status,
        subscription_status,
        is_paused,
        paused_reason,
        accent_color,
        landing_banner,
        landing_services,
        landing_gallery,
        landing_video_url,
        business_hours,
        categories ( name, slug, is_service )
      `,
      )
      .eq("slug", slug)
      .eq("is_active", true)
      .is("deleted_at", null)
      .maybeSingle();

    if (error || !shop) {
      if (error) {
        console.error("getShopBySlug: fallo al traer la tienda por slug", {
          slug,
          error,
        });
      }
      return null;
    }

    return shop;
  },
  ["shop-by-slug"],
  { revalidate: 30 },
);

export const getRelatedShops = unstable_cache(
  async (
    shopId: string,
    categoryId: string | null,
    city: string | null,
    limit = 8,
  ) => {
    if (!categoryId && !city) return [];

    const supabase = createPublicClient();

    const filters = [
      categoryId ? `category_id.eq.${categoryId}` : null,
      city ? `city.eq."${city.replace(/"/g, '\\"')}"` : null,
    ].filter(Boolean);

    const { data, error } = await supabase
      .from("shops")
      .select(
        "id, name, slug, logo_url, city, verification_status, subscription_status",
      )
      .neq("id", shopId)
      .eq("is_active", true)
      .eq("is_paused", false)
      .is("deleted_at", null)
      .or(filters.join(","))
      .order("subscription_status", { ascending: false })
      .order("verification_status", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("getRelatedShops: fallo al traer tiendas relacionadas", {
        shopId,
        categoryId,
        city,
        error,
      });
    }

    return data ?? [];
  },
  ["related-shops"],
  { revalidate: 60 },
);

export async function getShopRating(shopId: string) {
  // Data pública (rating agregado): cliente público para no leer cookies.
  const supabase = createPublicClient();

  const { data, error } = await supabase.rpc("get_shop_rating", {
    p_shop_id: shopId,
  });

  if (error) {
    console.error("getShopRating: fallo al traer el rating de la tienda", {
      shopId,
      error,
    });
  }

  const row = data?.[0];

  return {
    avgRating: row?.avg_rating ? Number(row.avg_rating) : 0,
    reviewCount: row?.review_count ? Number(row.review_count) : 0,
  };
}

export async function getShopReviews(shopId: string) {
  // Data pública (reseñas visibles a cualquiera): cliente público.
  const supabase = createPublicClient();

  const { data, error } = await supabase.rpc("get_shop_reviews", {
    p_shop_id: shopId,
  });

  if (error || !data) {
    if (error) {
      console.error("getShopReviews: fallo al traer reseñas de la tienda", {
        shopId,
        error,
      });
    }
    return [];
  }

  return data.map((review) => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.created_at,
    clientId: review.client_id,
    clientName: review.client_name,
  }));
}

export async function getMyShopReview(shopId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("shop_reviews")
    .select("id, rating, comment")
    .eq("shop_id", shopId)
    .eq("client_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("getMyShopReview: fallo al traer la reseña del usuario", {
      shopId,
      userId: user.id,
      error,
    });
  }

  return data;
}

export const SITEMAP_SHOPS_LIMIT = 5000;

export const getSitemapShops = unstable_cache(
  async () => {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from("shops")
      .select("slug, updated_at")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(SITEMAP_SHOPS_LIMIT);

    if (error || !data) {
      if (error) {
        console.error("getSitemapShops: fallo al traer tiendas para el sitemap", {
          error,
        });
      }
      return [];
    }

    return data;
  },
  ["sitemap-shops"],
  { revalidate: 3600 },
);

export async function getShopFollowStats(shopId: string) {
  // Data pública (conteo de seguidores): cliente público.
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("get_shop_follow_stats", {
    p_shop_id: shopId,
  });

  if (error) {
    console.error("getShopFollowStats: fallo al traer stats de seguidores", {
      shopId,
      error,
    });
  }

  return data?.[0]?.follower_count ? Number(data[0].follower_count) : 0;
}

export async function getMyShopFollow(shopId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data, error } = await supabase
    .from("shop_follows")
    .select("id")
    .eq("shop_id", shopId)
    .eq("client_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("getMyShopFollow: fallo al verificar si el usuario sigue la tienda", {
      shopId,
      userId: user.id,
      error,
    });
  }

  return Boolean(data);
}

export async function getMyFollowedShops() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("shop_follows")
    .select(
      `
      created_at,
      shops (
        id, name, slug, logo_url, city,
        verification_status, subscription_status,
        categories ( name )
      )
    `,
    )
    .eq("client_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) {
    if (error) {
      console.error("getMyFollowedShops: fallo al traer tiendas seguidas", {
        userId: user.id,
        error,
      });
    }
    return [];
  }

  return data
    .map((row) => row.shops)
    .filter((shop): shop is NonNullable<typeof shop> => shop !== null);
}

export async function getMyContactHistory() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("shop_contacts")
    .select(
      `
      id, created_at,
      shops ( id, name, slug, logo_url ),
      products ( id, name )
    `,
    )
    .eq("client_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) {
    if (error) {
      console.error("getMyContactHistory: fallo al traer historial de contactos", {
        userId: user.id,
        error,
      });
    }
    return [];
  }

  const seenShopIds = new Set<string>();
  const deduped = [];

  for (const row of data) {
    if (!row.shops) continue;
    if (seenShopIds.has(row.shops.id)) continue;
    seenShopIds.add(row.shops.id);
    deduped.push(row);
  }

  return deduped;
}

export async function getActiveSubscriptionPlans() {
  const supabase = await createClient();

  const { data: plans, error } = await supabase
    .from("subscription_plans")
    .select("id, name, description, price, duration_days, benefits, applies_to, category_id")
    .eq("is_active", true)
    .order("price", { ascending: true })
    .limit(50);

  if (error) {
    console.error("getActiveSubscriptionPlans: fallo al traer planes activos", {
      error,
    });
  }

  return plans ?? [];
}

// Cacheado por request: layout y page de /mi-tienda la piden para el mismo
// shopId dentro del mismo render.
export const getMyActiveSubscription = cache(async (shopId: string) => {
  const supabase = await createClient();

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("id, plan_id, end_date, subscription_plans ( name, benefits )")
    .eq("shop_id", shopId)
    .eq("status", "active")
    .order("approved_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getMyActiveSubscription: fallo al traer suscripción activa", {
      shopId,
      error,
    });
  }

  return subscription;
});

export async function getMyPendingSubscription(shopId: string) {
  const supabase = await createClient();

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select(
      "id, status, created_at, payment_provider, galiopay_link_id, galiopay_proof_token, galiopay_checkout_url, mercadopago_reference_id, mercadopago_checkout_url, subscription_plans ( id, name )",
    )
    .eq("shop_id", shopId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getMyPendingSubscription: fallo al traer suscripción pendiente", {
      shopId,
      error,
    });
  }

  return subscription;
}

export const getProductDetail = unstable_cache(
  async (productId: string) => {
    const supabase = createPublicClient();

    const { data: product, error } = await supabase
      .from("products")
      .select(
        `
        id,
        shop_id,
        name,
        description,
        price,
        currency,
        is_active,
        category_id,
        video_url,
        categories ( id, name, slug, parent_id ),
        product_images ( id, url, sort_order ),
        product_variants ( id, name, price, sort_order ),
        product_attribute_values ( value, category_attributes ( key, label, type ) ),
        shops ( id, name, slug, whatsapp_number, verification_status, subscription_status, logo_url )
      `,
      )
      .eq("id", productId)
      .maybeSingle();

    if (error || !product) {
      if (error) {
        console.error("getProductDetail: fallo al traer el detalle del producto", {
          productId,
          error,
        });
      }
      return null;
    }

    let parentCategoryName: string | null = null;
    let parentCategorySlug: string | null = null;
    if (product.categories?.parent_id) {
      const { data: parentCategory, error: parentCategoryError } = await supabase
        .from("categories")
        .select("name, slug")
        .eq("id", product.categories.parent_id)
        .maybeSingle();

      if (parentCategoryError) {
        console.error("getProductDetail: fallo al traer la categoría padre", {
          productId,
          parentId: product.categories.parent_id,
          error: parentCategoryError,
        });
      }

      parentCategoryName = parentCategory?.name ?? null;
      parentCategorySlug = parentCategory?.slug ?? null;
    }

    const images = [...(product.product_images ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    const variants = [...(product.product_variants ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    );

    const attributesByLabel = new Map<
      string,
      { type: string; values: string[] }
    >();
    for (const row of product.product_attribute_values ?? []) {
      const label = row.category_attributes?.label;
      if (!label) continue;
      const group = attributesByLabel.get(label) ?? {
        type: row.category_attributes?.type ?? "text",
        values: [],
      };
      group.values.push(row.value);
      attributesByLabel.set(label, group);
    }
    const attributes = Array.from(attributesByLabel, ([label, group]) => ({
      label,
      type: group.type,
      values: group.values,
    }));

    return {
      id: product.id,
      shopId: product.shop_id,
      name: product.name,
      description: product.description,
      price: product.price,
      currency: product.currency,
      isActive: product.is_active,
      category: product.categories,
      parentCategoryName,
      parentCategorySlug,
      videoUrl: product.video_url,
      images,
      variants,
      attributes,
      shop: product.shops,
    };
  },
  ["product-detail"],
  { revalidate: 30 },
);

export const getFeedData = unstable_cache(
  async (limit: number, offset: number) => {
    const supabase = createPublicClient();

    const [
      { data: categories, error: categoriesError },
      { data: subcategories, error: subcategoriesError },
      { data: products, error: productsError },
    ] = await Promise.all([
      supabase
        .from("categories")
        .select("id, name, slug")
        .eq("is_active", true)
        .is("parent_id", null)
        .order("name"),
      supabase
        .from("categories")
        .select("id, name, slug, parent_id")
        .eq("is_active", true)
        .not("parent_id", "is", null)
        .order("name"),
      supabase.rpc("get_products_feed", { p_limit: limit, p_offset: offset }),
    ]);

    if (categoriesError) {
      console.error("getFeedData: fallo al traer categorías", {
        error: categoriesError,
      });
    }
    if (subcategoriesError) {
      console.error("getFeedData: fallo al traer subcategorías", {
        error: subcategoriesError,
      });
    }
    if (productsError) {
      console.error("getFeedData: fallo al traer productos del feed", {
        limit,
        offset,
        error: productsError,
      });
    }

    // "Tienda de ropa" va primero en el chip de rubros (pedido de negocio);
    // el resto mantiene el orden alfabético.
    const sortedCategories = [...(categories ?? [])].sort((a, b) => {
      if (a.slug === "tienda-de-ropa") return -1;
      if (b.slug === "tienda-de-ropa") return 1;
      return 0;
    });

    return {
      categories: sortedCategories,
      subcategories: subcategories ?? [],
      products: products ?? [],
    };
  },
  ["feed-data"],
  { revalidate: 30 },
);

export async function getMyFavorites() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: favorites, error } = await supabase
    .from("favorites")
    .select(
      `
      created_at,
      products (
        id,
        name,
        price,
        currency,
        shop_id,
        is_active,
        product_images ( url, sort_order ),
        shops ( id, name, is_featured:subscription_status, is_active )
      )
    `,
    )
    .eq("client_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !favorites) {
    if (error) {
      console.error("getMyFavorites: fallo al traer favoritos del usuario", {
        userId: user.id,
        error,
      });
    }
    return [];
  }

  return favorites
    .map((favorite) => favorite.products)
    .filter(
      (product): product is NonNullable<typeof product> =>
        product != null &&
        product.is_active === true &&
        product.shops?.is_active === true,
    )
    .map((product) => {
      const images = [...(product.product_images ?? [])].sort(
        (a, b) => a.sort_order - b.sort_order,
      );

      return {
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        shop_id: product.shop_id,
        shop_name: product.shops?.name ?? "",
        shop_is_featured: product.shops?.is_featured === "active",
        distance_km: null,
        main_image: images[0]?.url ?? null,
      };
    });
}

export const SHOP_PRODUCTS_PAGE_SIZE = 24;

export async function getShopProducts(
  shopId: string,
  limit = SHOP_PRODUCTS_PAGE_SIZE,
  offset = 0,
) {
  // Cliente público: los productos activos de una tienda son data pública
  // (permite servir /tienda/[slug] estática/ISR).
  const supabase = createPublicClient();

  const { data: products, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      price,
      currency,
      is_featured,
      wholesale_price,
      min_order_qty,
      video_url,
      product_images ( url, sort_order )
    `,
    )
    .eq("shop_id", shopId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !products) {
    if (error) {
      console.error("getShopProducts: fallo al traer productos de la tienda", {
        shopId,
        limit,
        offset,
        error,
      });
    }
    return [];
  }

  return products.map((product) => {
    const images = [...(product.product_images ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    );

    return {
      id: product.id,
      name: product.name,
      price: product.price,
      currency: product.currency,
      is_featured: product.is_featured,
      wholesale_price: product.wholesale_price,
      min_order_qty: product.min_order_qty,
      video_url: product.video_url,
      main_image: images[0]?.url ?? null,
    };
  });
}

// opts permite que el caller pase datos que ya tiene y evitar round-trips:
//  - usedCount: el conteo de productos de la tienda ya calculado (ej. la
//    página de productos ya lo obtuvo de getMyShopProducts sin filtro de
//    búsqueda), para no repetir un count: 'exact' que escanea toda la tabla.
//  - isService: si el rubro es de servicios, ya derivable del getMyShop
//    cacheado, para no volver a pegarle a shops -> categories.
export async function getProductLimitInfo(
  shopId: string,
  opts?: { usedCount?: number; isService?: boolean; categoryId?: string | null },
) {
  const supabase = await createClient();

  const needsCount = opts?.usedCount === undefined;
  const needsShop = opts?.isService === undefined;

  const [
    countResult,
    activeSubscription,
    shopResult,
    limitsData,
  ] = await Promise.all([
    needsCount
      ? supabase.from("products").select("id", { count: "exact", head: true }).eq("shop_id", shopId)
      : Promise.resolve(null),
    // Cacheada por request: en la página de productos el layout ya la trajo
    // para este shopId, así que acá suele ser un cache hit.
    getMyActiveSubscription(shopId),
    needsShop
      ? supabase
          .from("shops")
          .select("category_id, categories ( is_service )")
          .eq("id", shopId)
          .maybeSingle()
      : Promise.resolve(null),
    getPlanLimitsData(),
  ]);

  if (countResult?.error) {
    console.error("getProductLimitInfo: fallo al contar productos de la tienda", {
      shopId,
      error: countResult.error,
    });
  }
  if (shopResult?.error) {
    console.error("getProductLimitInfo: fallo al traer datos de la tienda", {
      shopId,
      error: shopResult.error,
    });
  }

  const used = opts?.usedCount ?? countResult?.count ?? 0;
  const benefits = activeSubscription?.subscription_plans?.benefits as
    { max_products?: number | null } | null | undefined;

  const hasActivePlan = Boolean(activeSubscription);
  const isService = opts?.isService ?? Boolean(shopResult?.data?.categories?.is_service);
  const categoryId = opts?.categoryId ?? shopResult?.data?.category_id ?? null;
  const freeLimits = resolveFreeLimits(limitsData, isService, categoryId);
  const freeMax = isService
    ? (freeLimits?.max_products_service ?? null)
    : (freeLimits?.max_products_product ?? null);
  const max = hasActivePlan ? (benefits?.max_products ?? null) : freeMax;

  return {
    used,
    max,
    reached: max !== null && used >= max,
  };
}

// Límite de socios de gimnasio. Free capea el padrón activo (no archivados);
// el plan pago lo lee de benefits.max_gym_members (null = ilimitado). Mismo
// patrón que getProductLimitInfo pero para el rubro gimnasio (siempre servicio).
export async function getGymMemberLimitInfo(
  shopId: string,
  opts?: { usedCount?: number },
) {
  const supabase = await createClient();

  const needsCount = opts?.usedCount === undefined;
  const [countResult, activeSubscription, limitsData, shopResult] = await Promise.all([
    needsCount
      ? supabase
          .from("gym_members")
          .select("id", { count: "exact", head: true })
          .eq("shop_id", shopId)
          .eq("is_archived", false)
      : Promise.resolve(null),
    getMyActiveSubscription(shopId),
    getPlanLimitsData(),
    supabase.from("shops").select("category_id").eq("id", shopId).maybeSingle(),
  ]);

  if (countResult?.error) {
    console.error("getGymMemberLimitInfo: fallo al contar socios", {
      shopId,
      error: countResult.error,
    });
  }
  if (shopResult.error) {
    console.error("getGymMemberLimitInfo: fallo al traer datos de la tienda", {
      shopId,
      error: shopResult.error,
    });
  }

  const used = opts?.usedCount ?? countResult?.count ?? 0;
  const benefits = activeSubscription?.subscription_plans?.benefits as
    { max_gym_members?: number | null } | null | undefined;

  const hasActivePlan = Boolean(activeSubscription);
  const freeLimits = resolveFreeLimits(limitsData, true, shopResult.data?.category_id ?? null);
  const freeMax = freeLimits?.max_gym_members ?? null;
  const max = hasActivePlan ? (benefits?.max_gym_members ?? null) : freeMax;

  return {
    used,
    max,
    reached: max !== null && used >= max,
  };
}

export async function getProductImageLimitInfo(shopId: string) {
  const supabase = await createClient();

  const [{ data: activeSubscription, error }, limitsData] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("subscription_plans ( benefits )")
      .eq("shop_id", shopId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getPlanLimitsData(),
  ]);

  if (error) {
    console.error("getProductImageLimitInfo: fallo al traer suscripción activa", {
      shopId,
      error,
    });
  }

  const benefits = activeSubscription?.subscription_plans?.benefits as
    { max_images?: number | null } | null | undefined;

  const hasActivePlan = Boolean(activeSubscription);
  const max = hasActivePlan
    ? (benefits?.max_images ?? limitsData.defaultLimits?.max_images ?? 5)
    : (resolveAnyFreeLimits(limitsData)?.max_images ?? 2);

  return { max };
}

export async function getProductVariantLimitInfo(shopId: string) {
  const supabase = await createClient();

  const [{ data: activeSubscription, error }, limitsData] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("subscription_plans ( benefits )")
      .eq("shop_id", shopId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getPlanLimitsData(),
  ]);

  if (error) {
    console.error("getProductVariantLimitInfo: fallo al traer suscripción activa", {
      shopId,
      error,
    });
  }

  const benefits = activeSubscription?.subscription_plans?.benefits as
    { max_variants?: number | null } | null | undefined;

  const hasActivePlan = Boolean(activeSubscription);
  const max = hasActivePlan
    ? (benefits?.max_variants ?? limitsData.defaultLimits?.max_variants ?? 10)
    : (resolveAnyFreeLimits(limitsData)?.max_variants ?? 3);

  return { max };
}

const FREE_PLAN_MAX_VIDEOS = 3;

export async function getProductVideoLimitInfo(shopId: string) {
  const supabase = await createClient();

  const [
    { count, error: countError },
    { data: activeSubscription, error: subscriptionError },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("shop_id", shopId)
      .not("video_url", "is", null),
    supabase
      .from("subscriptions")
      .select("subscription_plans ( benefits )")
      .eq("shop_id", shopId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (countError) {
    console.error("getProductVideoLimitInfo: fallo al contar videos de productos", {
      shopId,
      error: countError,
    });
  }
  if (subscriptionError) {
    console.error("getProductVideoLimitInfo: fallo al traer suscripción activa", {
      shopId,
      error: subscriptionError,
    });
  }

  const used = count ?? 0;
  const benefits = activeSubscription?.subscription_plans?.benefits as
    { max_videos?: number | null } | null | undefined;

  const hasActivePlan = Boolean(activeSubscription);
  const max = hasActivePlan
    ? (benefits?.max_videos ?? null)
    : FREE_PLAN_MAX_VIDEOS;

  return {
    used,
    max,
    reached: max !== null && used >= max,
  };
}
