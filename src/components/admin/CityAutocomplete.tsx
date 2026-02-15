import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

const SC_CITIES = [
  "Florianópolis - SC",
  "Joinville - SC",
  "Blumenau - SC",
  "Balneário Camboriú - SC",
  "Itajaí - SC",
  "São José - SC",
  "Criciúma - SC",
  "Chapecó - SC",
  "Jaraguá do Sul - SC",
  "Brusque - SC",
  "Tubarão - SC",
  "Lages - SC",
  "Itapema - SC",
  "Palhoça - SC",
  "Araranguá - SC",
  "Sombrio - SC",
  "Içara - SC",
  "Sangão - SC",
  "Morro da Fumaça - SC",
  "Treze de Maio - SC",
  "Jaguaruna - SC",
  "Balneário Rincão - SC",
];

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const CityAutocomplete = ({ value, onChange, className }: CityAutocompleteProps) => {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value?.trim()) {
      setFiltered([]);
      return;
    }
    const q = value.toLowerCase();
    setFiltered(SC_CITIES.filter((c) => c.toLowerCase().includes(q)));
  }, [value]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        placeholder="Ex: Florianópolis - SC"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className={className}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-md border bg-popover shadow-md">
          {filtered.map((city) => (
            <li
              key={city}
              className="cursor-pointer px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
              onMouseDown={() => {
                onChange(city);
                setOpen(false);
              }}
            >
              {city}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CityAutocomplete;
