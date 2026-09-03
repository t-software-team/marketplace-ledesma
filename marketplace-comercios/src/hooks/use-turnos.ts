import { useQueries, useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface AvailableSlot {
  starts_at: string;
  ends_at: string;
}

async function fetchAvailableSlots(
  shopId: string,
  date: string,
): Promise<AvailableSlot[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_available_slots", {
    p_shop_id: shopId,
    p_date: date,
  });

  if (error) {
    console.error("useAvailableSlots: fallo al leer disponibilidad", {
      shopId,
      date,
      error,
    });
    throw error;
  }

  return data ?? [];
}

export function useAvailableSlots(shopId: string, date: string) {
  return useQuery({
    queryKey: ["available-slots", shopId, date],
    queryFn: () => fetchAvailableSlots(shopId, date),
  });
}

export function useAvailableSlotsForDates(shopId: string, dates: string[]) {
  return useQueries({
    queries: dates.map((date) => ({
      queryKey: ["available-slots", shopId, date],
      queryFn: () => fetchAvailableSlots(shopId, date),
    })),
  });
}
