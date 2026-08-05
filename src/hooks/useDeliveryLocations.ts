import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  DELIVERY_LOCATIONS as FALLBACK_LOCATIONS,
  type DeliveryLocation,
} from '@/data/deliveryLocations';

export type { DeliveryLocation };

/**
 * Live delivery locations + admin-managed prices.
 * Falls back to the bundled baseline list if the table is unreachable,
 * so checkout never blocks on a network hiccup.
 */
export const useDeliveryLocations = () => {
  const [locations, setLocations] = useState<DeliveryLocation[]>(FALLBACK_LOCATIONS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('delivery_locations')
      .select('code, name, region, price, is_active, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (!error && data && data.length > 0) {
      setLocations(
        data.map((row) => ({
          id: row.code,
          name: row.name,
          region: row.region || '',
          price: Number(row.price) || 0,
        })),
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Keep prices in sync when an admin edits them
  useEffect(() => {
    const channel = supabase
      .channel('delivery-locations-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_locations' }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const find = useCallback(
    (id: string) => locations.find((l) => l.id === id),
    [locations],
  );

  const search = useCallback(
    (query: string, limit = 8): DeliveryLocation[] => {
      const q = query.trim().toLowerCase();
      if (!q) return locations.slice(0, limit);
      const startsWith: DeliveryLocation[] = [];
      const includes: DeliveryLocation[] = [];
      for (const loc of locations) {
        const name = loc.name.toLowerCase();
        const region = loc.region.toLowerCase();
        if (name.startsWith(q) || region.startsWith(q)) startsWith.push(loc);
        else if (name.includes(q) || region.includes(q)) includes.push(loc);
        if (startsWith.length + includes.length >= limit * 2) break;
      }
      return [...startsWith, ...includes].slice(0, limit);
    },
    [locations],
  );

  return useMemo(() => ({ locations, loading, find, search, reload: load }), [locations, loading, find, search, load]);
};

export default useDeliveryLocations;
