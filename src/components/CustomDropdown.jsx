import React, { useState, useEffect, useRef } from "react";
import "./CustomDropdown.css";
import { ChevronDown } from "lucide-react";

export default function CustomDropdown({ options, value, onChange, label, variant = "6" }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getOptionDetails = (val) => {
    const found = options.find((o) => (typeof o === "object" ? o.value === val : o === val));
    if (!found) return { value: val, label: val || label };
    return typeof found === "object" ? found : { value: found, label: found };
  };

  const selectedOption = getOptionDetails(value);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={`dropdown dropdown-${variant}`} ref={containerRef}>
      <button
        type="button"
        className="dropdown-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOption.label || label}</span>
        <ChevronDown size={16} className={`chevron-icon ${isOpen ? "rotate" : ""}`} />
      </button>

      <div className={`dropdown-menu ${isOpen ? "show" : ""}`}>
        {options.map((opt, idx) => {
          const isOptObject = typeof opt === "object";
          const optVal = isOptObject ? opt.value : opt;
          const optLabel = isOptObject ? opt.label : opt;
          const optIcon = isOptObject ? opt.icon : null;

          return (
            <button
              key={`${optVal}-${idx}`}
              type="button"
              className="dropdown-item"
              onClick={() => handleSelect(optVal)}
            >
              {optIcon && <span className="item-icon">{optIcon}</span>}
              <span>{optLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
