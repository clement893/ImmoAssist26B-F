'use client';

import { useRef, useEffect, useState } from 'react';
import Input from '@/components/ui/Input';

const GOOGLE_SCRIPT_URL = 'https://maps.googleapis.com/maps/api/js';

function loadGoogleMapsScript(apiKey: string): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if ((window as unknown as { google?: { maps?: unknown } }).google?.maps) return Promise.resolve(true);
  const existing = document.querySelector(`script[src^="${GOOGLE_SCRIPT_URL}"]`);
  if (existing) return Promise.resolve(true);

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = `${GOOGLE_SCRIPT_URL}?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export interface AddressResult {
  /** Full formatted address (street + city, etc.) */
  address: string;
  /** Street line (number + route) */
  street?: string;
  /** City / locality */
  city?: string;
  /** Postal code */
  postal_code?: string;
  /** Province / state (e.g. QC, ON) */
  province?: string;
}

/** Minimal type for Google Place result (no @types/google.maps dependency) */
interface PlaceLike {
  address_components?: Array< { long_name: string; short_name: string; types: string[] }>;
  formatted_address?: string;
  name?: string;
}

/** Minimal type for Autocomplete instance (no global google namespace) */
interface AutocompleteLike {
  getPlace: () => PlaceLike & { formatted_address?: string };
  addListener: (event: string, callback: () => void) => { remove: () => void };
}

interface AddressAutocompleteInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (result: AddressResult) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  /** Google Maps API key. If not set, uses NEXT_PUBLIC_GOOGLE_MAPS_API_KEY or normal input. */
  apiKey?: string;
}

function getComponent(place: PlaceLike, type: string): string {
  const components = place.address_components || [];
  const c = components.find((x) => x.types.includes(type));
  return c ? (type === 'administrative_area_level_1' ? c.short_name : c.long_name) : '';
}

function parsePlaceToAddress(place: PlaceLike): AddressResult {
  const streetNumber = getComponent(place, 'street_number');
  const route = getComponent(place, 'route');
  const street = [streetNumber, route].filter(Boolean).join(' ').trim() || (place.name || '');
  const city = getComponent(place, 'locality') || getComponent(place, 'sublocality_level_1') || getComponent(place, 'administrative_area_level_2');
  const postal_code = getComponent(place, 'postal_code');
  const province = getComponent(place, 'administrative_area_level_1');
  const address = place.formatted_address || [street, city, province, postal_code].filter(Boolean).join(', ');
  return { address, street: street || undefined, city: city || undefined, postal_code: postal_code || undefined, province: province || undefined };
}

export default function AddressAutocompleteInput({
  label = 'Adresse',
  value,
  onChange,
  onSelect,
  placeholder = 'Rechercher une adresse (Google)',
  required,
  disabled,
  error,
  helperText,
  className,
  apiKey,
}: AddressAutocompleteInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<AutocompleteLike | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const key = apiKey ?? (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY : undefined);

  useEffect(() => {
    if (!key || !inputRef.current || disabled) return;
    loadGoogleMapsScript(key).then((ok) => {
      setScriptLoaded(ok);
      if (!ok || !inputRef.current) return;
      const g = (window as unknown as { google?: { maps?: { places?: { Autocomplete: new (input: HTMLInputElement, opts?: object) => AutocompleteLike } } } }).google;
      if (!g?.maps?.places) return;
      try {
        const Autocomplete = g.maps.places.Autocomplete;
        const ac = new Autocomplete(inputRef.current, {
          types: ['address'],
          componentRestrictions: { country: ['ca'] },
          fields: ['address_components', 'formatted_address', 'name'],
        });
        const listener = ac.addListener('place_changed', () => {
          const place = ac.getPlace();
          if (place.formatted_address) {
            onChange(place.formatted_address);
            onSelect?.(parsePlaceToAddress(place as PlaceLike));
          }
        });
        autocompleteRef.current = ac;
        return () => {
          try {
            if (listener && typeof listener.remove === 'function') listener.remove();
          } catch (_) {}
          autocompleteRef.current = null;
        };
      } catch (_) {
        setScriptLoaded(false);
      }
    });
  }, [key, disabled, onChange, onSelect]);

  return (
    <Input
      ref={inputRef}
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={scriptLoaded && key ? placeholder : 'Ex. 123 rue Principale, Montréal'}
      required={required}
      disabled={disabled}
      error={error}
      helperText={helperText ?? (key ? 'Commencez à taper pour rechercher une adresse complète (Google).' : undefined)}
      className={className}
    />
  );
}
