import { useRef, useState } from 'react';
import { placeGroups } from '../data/places';
import type { PlaceGroup } from '../data/places';

interface LocationComboboxProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
}

function filterGroups(groups: PlaceGroup[], query: string): PlaceGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return groups;
  return groups
    .map((group) => ({ ...group, places: group.places.filter((p) => p.toLowerCase().includes(q)) }))
    .filter((group) => group.places.length > 0);
}

/**
 * A searchable pick-up/drop-off field: a text input that filters the same
 * place list the old <select> used, but also accepts free-typed text (a
 * villa name, a description of a spot, anything) as a valid value in its
 * own right — whatever's typed is shown right here, not tucked away behind
 * a generic "Other address" placeholder. Tapping a spot on the map updates
 * this the same way, since both go through the same onChange.
 */
export default function LocationCombobox({ id, value, onChange }: LocationComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [dirty, setDirty] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the input's text in sync with the controlled value whenever it
  // changes from outside (e.g. tapping a pin on the map) — but only while
  // this field isn't actively being edited, so a fresh external pick isn't
  // clobbered by (or doesn't clobber) in-progress typing.
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue && !open) {
    setLastValue(value);
    setQuery(value);
  }

  const groups = filterGroups(placeGroups, dirty ? query : '');
  const flatPlaces = groups.flatMap((g) => g.places);

  function commit(name: string) {
    setQuery(name);
    setDirty(false);
    setOpen(false);
    setActiveIndex(-1);
    onChange(name);
  }

  function handleFocus() {
    setOpen(true);
    setDirty(false);
    setActiveIndex(-1);
    // Select the existing text so typing immediately starts a fresh search
    // instead of appending to "Airport".
    requestAnimationFrame(() => inputRef.current?.select());
  }

  function handleBlur() {
    setOpen(false);
    const trimmed = query.trim();
    if (trimmed && trimmed !== value) {
      onChange(trimmed);
    } else {
      setQuery(value);
    }
    setDirty(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setQuery(value);
      setDirty(false);
      setOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => (flatPlaces.length ? (i + 1) % flatPlaces.length : -1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => (flatPlaces.length ? (i - 1 + flatPlaces.length) % flatPlaces.length : -1));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < flatPlaces.length) {
        commit(flatPlaces[activeIndex]);
      } else if (query.trim()) {
        commit(query.trim());
      }
    }
  }

  const showEmptyHint = dirty && query.trim() !== '' && flatPlaces.length === 0;

  return (
    <div className="location-combobox">
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        autoComplete="off"
        value={query}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onChange={(e) => {
          setQuery(e.target.value);
          setDirty(true);
          setOpen(true);
          setActiveIndex(-1);
        }}
        placeholder="Search or type an address"
      />
      {open && (
        <div className="location-combobox-menu" role="listbox">
          {groups.map((group) => (
            <div className="location-combobox-group" key={group.label}>
              <span className="location-combobox-group-label">{group.label}</span>
              {group.places.map((place) => {
                const flatIndex = flatPlaces.indexOf(place);
                return (
                  <button
                    type="button"
                    key={place}
                    role="option"
                    aria-selected={place === value}
                    className={`location-combobox-option${flatIndex === activeIndex ? ' active' : ''}${place === value ? ' selected' : ''}`}
                    // Fires before the input's onBlur would close the menu.
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => commit(place)}
                  >
                    {place}
                  </button>
                );
              })}
            </div>
          ))}
          {showEmptyHint && (
            <div className="location-combobox-hint">
              No matches — press <kbd>Enter</kbd> to use &ldquo;{query.trim()}&rdquo; as typed
            </div>
          )}
        </div>
      )}
    </div>
  );
}
