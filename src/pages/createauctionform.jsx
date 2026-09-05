import React, { useEffect, useRef, useState } from "react";
import "../styles/createauctionform.css";

/* =========================================================
   CATEGORY / CONDITION / WARRANTY / SHIPPING OPTIONS
========================================================= */

const CATEGORY_OPTIONS = [
  { value: "electronics", label: "Electronics" },
  { value: "mobile", label: "Mobile & Tablets" },
  { value: "laptop", label: "Laptop & Computers" },
  { value: "vehicles", label: "Vehicles" },
  { value: "fashion", label: "Fashion" },
  { value: "furniture", label: "Furniture" },
  { value: "collectibles", label: "Collectibles" },
  { value: "books", label: "Books" },
  { value: "other", label: "Other" },
];

const CONDITION_OPTIONS = [
  { value: "new", label: "New" },
  { value: "like-new", label: "Like New" },
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "used", label: "Used" },
];

const WARRANTY_OPTIONS = [
  { value: "no-warranty", label: "No Warranty" },
  { value: "active", label: "Warranty Active" },
  { value: "expired", label: "Warranty Expired" },
  { value: "extended", label: "Extended Warranty" },
];

const SHIPPING_PAID_BY_OPTIONS = [
  { value: "buyer", label: "Buyer Pays" },
  { value: "seller", label: "Seller Pays" },
];

/* =========================================================
   CUSTOM SEARCHABLE DROPDOWN
========================================================= */

const CustomSelect = ({
  name,
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  icon = null,
  currency = false,
  searchable = true,
  required = false,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const wrapRef = useRef(null);
  const searchRef = useRef(null);


  const selected = options.find((o) => o.value === value) || null;
  

  const filtered = query.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(query.trim().toLowerCase())
      )
    : options;

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handleClick);

    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open && searchable && searchRef.current) {
      searchRef.current.focus();
    }

    if (open) {
      const idx = filtered.findIndex((o) => o.value === value);
      setActiveIndex(idx >= 0 ? idx : 0);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const commit = (val) => {
    onChange(name, val);
    setOpen(false);
    setQuery("");
  };

  const handleTriggerKeyDown = (e) => {
    if (disabled) return;

    if (
      e.key === "Enter" ||
      e.key === " " ||
      e.key === "ArrowDown"
    ) {
      e.preventDefault();
      setOpen(true);
    }
  };

  const handleListKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) =>
        Math.min(i + 1, filtered.length - 1)
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();

      if (filtered[activeIndex]) {
        commit(filtered[activeIndex].value);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  };

  return (
    <div
      className={`cs-select${open ? " cs-open" : ""}${
        disabled ? " cs-disabled" : ""
      }`}
      ref={wrapRef}
    >
      <button
        type="button"
        className={`cs-trigger${
          icon || currency ? " cs-has-icon" : ""
        }`}
        onClick={() =>
          !disabled && setOpen((o) => !o)
        }
        onKeyDown={handleTriggerKeyDown}
        disabled={disabled}
      >
        {icon && (
          <span
            className={
              currency
                ? "cs-currency-icon"
                : "cs-left-icon"
            }
          >
            {icon}
          </span>
        )}

        <span
          className={`cs-trigger-text${
            !selected ? " cs-placeholder" : ""
          }`}
        >
          {selected ? selected.label : placeholder}
        </span>

        <span className="cs-chevron">
          <svg
            width="11"
            height="7"
            viewBox="0 0 11 7"
            fill="none"
          >
            <path
              d="M1 1L5.5 5.5L10 1"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {required && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          className="cs-native-required"
          value={value || ""}
          onChange={() => {}}
          required
        />
      )}

      {open && (
        <div
          className="cs-panel"
          onKeyDown={handleListKeyDown}
        >
          {searchable && (
            <div className="cs-search-wrap">
              <span className="cs-search-icon">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                >
                  <circle
                    cx="6"
                    cy="6"
                    r="4.6"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  />
                  <path
                    d="M12 12L9.4 9.4"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>

              <input
                ref={searchRef}
                type="text"
                className="cs-search-input"
                placeholder="Search options..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
              />
            </div>
          )}

          <div
            className="cs-options"
            role="listbox"
          >
            {filtered.length === 0 && (
              <div className="cs-no-results">
                No options found
              </div>
            )}

            {filtered.map((opt, i) => {
              const isSelected = opt.value === value;
              const isActive = i === activeIndex;

              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  className={`cs-option${
                    isSelected
                      ? " cs-option-selected"
                      : ""
                  }${
                    isActive && !isSelected
                      ? " cs-option-active"
                      : ""
                  }`}
                  onMouseEnter={() =>
                    setActiveIndex(i)
                  }
                  onClick={() =>
                    commit(opt.value)
                  }
                >
                  <span>{opt.label}</span>

                  {isSelected && (
                    <span className="cs-check">
                      <svg
                        width="13"
                        height="10"
                        viewBox="0 0 13 10"
                        fill="none"
                      >
                        <path
                          d="M1 5L4.5 8.5L12 1"
                          stroke="currentColor"
                          strokeWidth="1.9"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================
   CUSTOM DATE / DATE-TIME PICKER
========================================================= */

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_NAMES = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

const pad2 = (n) =>
  String(n).padStart(2, "0");

const parseFieldValue = (value, mode) => {
  if (!value) return null;

  if (mode === "date") {
    const [y, m, d] =
      value.split("-").map(Number);

    if (!y || !m || !d) return null;

    return new Date(y, m - 1, d);
  }

  const [datePart, timePart] =
    value.split("T");

  if (!datePart) return null;

  const [y, m, d] =
    datePart.split("-").map(Number);

  if (!y || !m || !d) return null;

  const date = new Date(y, m - 1, d);

  if (timePart) {
    const [hh, mm] =
      timePart.split(":").map(Number);

    date.setHours(
      hh || 0,
      mm || 0,
      0,
      0
    );
  } else {
    date.setHours(9, 0, 0, 0);
  }

  return date;
};

const formatFieldValue = (date, mode) => {
  if (!date) return "";

  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());

  if (mode === "date") {
    return `${y}-${m}-${d}`;
  }

  const hh = pad2(date.getHours());
  const mm = pad2(date.getMinutes());

  return `${y}-${m}-${d}T${hh}:${mm}`;
};

const formatDisplay = (date, mode) => {
  if (!date) return "";

  const datePart = `${
    MONTH_NAMES[date.getMonth()].slice(0, 3)
  } ${date.getDate()}, ${date.getFullYear()}`;

  if (mode === "date") {
    return datePart;
  }

  let h = date.getHours();

  const mDisp = pad2(
    date.getMinutes()
  );

  const ampm =
    h >= 12 ? "PM" : "AM";

  h = h % 12;

  if (h === 0) h = 12;

  return `${datePart}, ${pad2(
    h
  )}:${mDisp} ${ampm}`;
};

const CustomDateField = ({
  name,
  value,
  onChange,
  mode = "datetime",
  placeholder = "Select date",
  required = false,
}) => {
  const [open, setOpen] =
    useState(false);

  const initial =
    parseFieldValue(value, mode);

  const [viewDate, setViewDate] =
    useState(
      initial || new Date()
    );

  const [selectedDate, setSelectedDate] =
    useState(initial);

  const [hour12, setHour12] =
    useState(() => {
      if (!initial) return 9;

      const h =
        initial.getHours() % 12;

      return h === 0 ? 12 : h;
    });

  const [minute, setMinute] =
    useState(() =>
      initial
        ? initial.getMinutes()
        : 0
    );

  const [ampm, setAmpm] =
    useState(() =>
      initial &&
      initial.getHours() >= 12
        ? "PM"
        : "AM"
    );

  const wrapRef =
    useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (
        wrapRef.current &&
        !wrapRef.current.contains(
          e.target
        )
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClick
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClick
      );
  }, []);

  useEffect(() => {
    const parsed =
      parseFieldValue(
        value,
        mode
      );

    setSelectedDate(parsed);

    if (parsed) {
      setViewDate(parsed);

      const h =
        parsed.getHours() % 12;

      setHour12(
        h === 0 ? 12 : h
      );

      setMinute(
        parsed.getMinutes()
      );

      setAmpm(
        parsed.getHours() >= 12
          ? "PM"
          : "AM"
      );
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const daysInMonth = (y, m) =>
    new Date(
      y,
      m + 1,
      0
    ).getDate();

  const buildCalendarDays = () => {
    const y =
      viewDate.getFullYear();

    const m =
      viewDate.getMonth();

    const firstDay =
      new Date(
        y,
        m,
        1
      ).getDay();

    const totalDays =
      daysInMonth(y, m);

    const prevMonthDays =
      daysInMonth(y, m - 1);

    const cells = [];

    for (
      let i = firstDay - 1;
      i >= 0;
      i--
    ) {
      cells.push({
        day:
          prevMonthDays - i,
        muted: true,
        month: m - 1,
      });
    }

    for (
      let d = 1;
      d <= totalDays;
      d++
    ) {
      cells.push({
        day: d,
        muted: false,
        month: m,
      });
    }

    while (
      cells.length % 7 !== 0
    ) {
      cells.push({
        day:
          cells.length -
          (firstDay + totalDays) +
          1,
        muted: true,
        month: m + 1,
      });
    }

    return cells;
  };

  const isSameDay = (a, b) =>
    a &&
    b &&
    a.getFullYear() ===
      b.getFullYear() &&
    a.getMonth() ===
      b.getMonth() &&
    a.getDate() ===
      b.getDate();

  const today = new Date();

  const commitDatePick = (
    day,
    cellMonth
  ) => {
    const newDate = new Date(
      viewDate.getFullYear(),
      cellMonth,
      day
    );

    if (mode === "date") {
      setSelectedDate(newDate);

      onChange(
        name,
        formatFieldValue(
          newDate,
          mode
        )
      );

      setOpen(false);

      return;
    }

    let h = hour12 % 12;

    if (ampm === "PM") {
      h += 12;
    }

    newDate.setHours(
      h,
      minute,
      0,
      0
    );

    setSelectedDate(newDate);

    onChange(
      name,
      formatFieldValue(
        newDate,
        mode
      )
    );
  };

  const applyTime = (
    nextHour12,
    nextMinute,
    nextAmpm
  ) => {
    setHour12(nextHour12);
    setMinute(nextMinute);
    setAmpm(nextAmpm);

    if (!selectedDate) return;

    let h =
      nextHour12 % 12;

    if (nextAmpm === "PM") {
      h += 12;
    }

    const newDate =
      new Date(selectedDate);

    newDate.setHours(
      h,
      nextMinute,
      0,
      0
    );

    setSelectedDate(newDate);

    onChange(
      name,
      formatFieldValue(
        newDate,
        mode
      )
    );
  };

  const stepHour = (dir) => {
    let h = hour12 + dir;

    if (h > 12) h = 1;
    if (h < 1) h = 12;

    applyTime(
      h,
      minute,
      ampm
    );
  };

  const stepMinute = (dir) => {
    let m = minute + dir;

    if (m > 59) m = 0;
    if (m < 0) m = 59;

    applyTime(
      hour12,
      m,
      ampm
    );
  };

  const toggleAmpm = () =>
    applyTime(
      hour12,
      minute,
      ampm === "AM"
        ? "PM"
        : "AM"
    );

  const handleClear = () => {
    setSelectedDate(null);

    onChange(name, "");

    setOpen(false);
  };

  const handleToday = () => {
    const now = new Date();

    setViewDate(now);

    if (mode === "date") {
      setSelectedDate(now);

      onChange(
        name,
        formatFieldValue(
          now,
          mode
        )
      );

      setOpen(false);

      return;
    }

    const h12 =
      now.getHours() % 12 === 0
        ? 12
        : now.getHours() % 12;

    const ap =
      now.getHours() >= 12
        ? "PM"
        : "AM";

    setHour12(h12);

    setMinute(
      now.getMinutes()
    );

    setAmpm(ap);

    setSelectedDate(now);

    onChange(
      name,
      formatFieldValue(
        now,
        mode
      )
    );
  };

  const changeMonth = (dir) => {
    setViewDate((prev) =>
      new Date(
        prev.getFullYear(),
        prev.getMonth() + dir,
        1
      )
    );
  };

  const cells =
    buildCalendarDays();

  const display =
    formatDisplay(
      selectedDate,
      mode
    );

  return (
    <div
      className={`cdf-field${
        open ? " cdf-open" : ""
      }`}
      ref={wrapRef}
    >
      <button
        type="button"
        className="cdf-trigger"
        onClick={() =>
          setOpen((o) => !o)
        }
      >
        <span className="cdf-icon">
          <svg
            width="15"
            height="15"
            viewBox="0 0 16 16"
            fill="none"
          >
            <rect
              x="1.5"
              y="2.5"
              width="13"
              height="12"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.3"
            />
            <path
              d="M1.5 6H14.5"
              stroke="currentColor"
              strokeWidth="1.3"
            />
            <path
              d="M4.5 1V3.3M11.5 1V3.3"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
        </span>

        <span
          className={`cdf-text${
            !display
              ? " cdf-placeholder"
              : ""
          }`}
        >
          {display || placeholder}
        </span>

        {mode === "datetime" && (
          <span className="cdf-clock-icon">
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
            >
              <circle
                cx="8"
                cy="8"
                r="6.3"
                stroke="currentColor"
                strokeWidth="1.3"
              />
              <path
                d="M8 4.7V8L10.3 9.6"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
          </span>
        )}
      </button>

      {required && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          className="cs-native-required"
          value={value || ""}
          onChange={() => {}}
          required
        />
      )}

      {open && (
        <div className="cdf-panel">

          <div className="cdf-cal-header">
            <button
              type="button"
              className="cdf-nav-btn"
              onClick={() =>
                changeMonth(-1)
              }
            >
              ‹
            </button>

            <span className="cdf-month-label">
              {
                MONTH_NAMES[
                  viewDate.getMonth()
                ]
              }
              ,{" "}
              {viewDate.getFullYear()}
            </span>

            <button
              type="button"
              className="cdf-nav-btn"
              onClick={() =>
                changeMonth(1)
              }
            >
              ›
            </button>
          </div>

          <div className="cdf-weekdays">
            {WEEKDAY_NAMES.map(
              (w) => (
                <span key={w}>
                  {w}
                </span>
              )
            )}
          </div>

          <div className="cdf-grid">
            {cells.map(
              (cell, i) => {
                const cellDate =
                  new Date(
                    viewDate.getFullYear(),
                    cell.month,
                    cell.day
                  );

                const isSelected =
                  isSameDay(
                    cellDate,
                    selectedDate
                  );

                const isToday =
                  isSameDay(
                    cellDate,
                    today
                  );

                return (
                  <button
                    type="button"
                    key={i}
                    className={`cdf-day${
                      cell.muted
                        ? " cdf-day-muted"
                        : ""
                    }${
                      isToday &&
                      !isSelected
                        ? " cdf-day-today"
                        : ""
                    }${
                      isSelected
                        ? " cdf-day-selected"
                        : ""
                    }`}
                    onClick={() => {
                      if (
                        cell.muted
                      ) {
                        setViewDate(
                          new Date(
                            viewDate.getFullYear(),
                            cell.month,
                            1
                          )
                        );
                      }

                      commitDatePick(
                        cell.day,
                        cell.month
                      );
                    }}
                  >
                    {cell.day}
                  </button>
                );
              }
            )}
          </div>

          {mode === "datetime" && (
            <div className="cdf-time-row">
              <span className="cdf-time-label">
                Time
              </span>

              <div className="cdf-stepper">
                <input
                  className="cdf-stepper-input"
                  value={pad2(hour12)}
                  onChange={(e) => {
                    const n =
                      parseInt(
                        e.target.value,
                        10
                      );

                    if (
                      !isNaN(n) &&
                      n >= 1 &&
                      n <= 12
                    ) {
                      applyTime(
                        n,
                        minute,
                        ampm
                      );
                    }
                  }}
                />

                <div className="cdf-stepper-arrows">
                  <button
                    type="button"
                    onClick={() =>
                      stepHour(1)
                    }
                  >
                    ▲
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      stepHour(-1)
                    }
                  >
                    ▼
                  </button>
                </div>
              </div>

              <span className="cdf-time-colon">
                :
              </span>

              <div className="cdf-stepper">
                <input
                  className="cdf-stepper-input"
                  value={pad2(minute)}
                  onChange={(e) => {
                    const n =
                      parseInt(
                        e.target.value,
                        10
                      );

                    if (
                      !isNaN(n) &&
                      n >= 0 &&
                      n <= 59
                    ) {
                      applyTime(
                        hour12,
                        n,
                        ampm
                      );
                    }
                  }}
                />

                <div className="cdf-stepper-arrows">
                  <button
                    type="button"
                    onClick={() =>
                      stepMinute(1)
                    }
                  >
                    ▲
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      stepMinute(-1)
                    }
                  >
                    ▼
                  </button>
                </div>
              </div>

              <div className="cdf-stepper">
                <input
                  className="cdf-stepper-input"
                  readOnly
                  value={ampm}
                  onClick={
                    toggleAmpm
                  }
                />

                <div className="cdf-stepper-arrows">
                  <button
                    type="button"
                    onClick={
                      toggleAmpm
                    }
                  >
                    ▲
                  </button>

                  <button
                    type="button"
                    onClick={
                      toggleAmpm
                    }
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="cdf-footer">
            <button
              type="button"
              className="cdf-footer-link"
              onClick={
                handleClear
              }
            >
              Clear
            </button>

            <button
              type="button"
              className="cdf-footer-link"
              onClick={
                handleToday
              }
            >
              Today
            </button>

            <button
              type="button"
              className="cdf-footer-done"
              onClick={() =>
                setOpen(false)
              }
            >
              Done
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const CreateAuction = () => {
  const [images, setImages] =
    useState([]);

  const [purchaseProof, setPurchaseProof] =
    useState(null);

  const [sellerProof, setSellerProof] =
    useState(null);

  // =========================================================
  // SUBMIT STATE
  // =========================================================

  const [submitLoading, setSubmitLoading] =
    useState(false);

  const [submitError, setSubmitError] =
    useState("");

  const [submitSuccess, setSubmitSuccess] =
    useState("");

  /* =========================================================
     SELLER TERMS POPUP
  ========================================================= */

  const [termsModalOpen, setTermsModalOpen] =
    useState(false);

  const [sellerTermsText, setSellerTermsText] =
    useState("");

  const [formData, setFormData] =
    useState({
      productTitle: "",
      brandModel: "",
      category: "",
      description: "",
      condition: "",

      purchaseDate: "",
      purchasedBy: "",
      purchasePrice: "",

      startingPrice: "",
      auctionStart: "",
      auctionEnd: "",

      locationArea: "",
      locationCity: "",
      locationState: "",
      locationCountry: "India",
      locationPincode: "",

      deliveryType: "pickup",

      shippingType: "free",
      shippingCharges: "",
      shippingPaidBy: "",

      warrantyStatus: "",

      paymentMethod: "",
      productTerms: "",
      termsAccepted: false,

      sellerName: "",
      sellerEmail: "",
      sellerContact: "",
    });

  /* =====================================================
     INPUT CHANGE
  ===================================================== */

  const handleChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;

    // Digits only
    if (name === "sellerContact") {
      value = value.replace(/\\D/g, "").slice(0, 10);
    }

    if (name === "locationPincode") {
      value = value.replace(/\\D/g, "").slice(0, 6);
    }

    // Letters, spaces, apostrophe and hyphen only
    if (
      name === "purchasedBy" ||
      name === "sellerName" ||
      name === "locationCity" ||
      name === "locationState" ||
      name === "locationCountry"
    ) {
      value = value.replace(/[^A-Za-z\\s'-]/g, "");
    }

    const maxLengths = {
      productTitle: 100,
      brandModel: 100,
      description: 1000,
      purchasedBy: 100,
      locationArea: 100,
      locationCity: 50,
      locationState: 50,
      locationCountry: 50,
      sellerName: 100,
      sellerEmail: 255,
    };

    if (maxLengths[name]) {
      value = value.slice(0, maxLengths[name]);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =====================================================
     CUSTOM SELECT CHANGE
  ===================================================== */

  const handleSelectChange = (
    name,
    value
  ) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =====================================================
     IMAGE UPLOAD
  ===================================================== */

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    const maxSize = 5 * 1024 * 1024;
    const remainingSlots = 12 - images.length;

    if (remainingSlots <= 0) {
      alert("You can upload a maximum of 12 images.");
      e.target.value = "";
      return;
    }

    const validFiles = [];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        alert(
          `${file.name} is not a valid image format. Use JPG, JPEG, PNG or WEBP.`
        );
        continue;
      }

      if (file.size > maxSize) {
        alert(`${file.name} exceeds the 5MB limit.`);
        continue;
      }

      validFiles.push(file);
    }

    const newImages = validFiles
      .slice(0, remainingSlots)
      .map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        name: file.name,
      }));

    setImages((prev) => [...prev, ...newImages]);

    e.target.value = "";
  };

  /* =====================================================
     REMOVE IMAGE
  ===================================================== */

  const removeImage = (index) => {
    setImages((prev) => {
      const image = prev[index];

      if (image?.preview) {
        URL.revokeObjectURL(
          image.preview
        );
      }

      return prev.filter(
        (_, i) => i !== index
      );
    });
  };

  /* =====================================================
     SUBMIT
  ===================================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitError("");
    setSubmitSuccess("");

    // =========================================================
    // REQUIRED FIELDS
    // =========================================================

    const requiredFields = [
      ["productTitle", "Auction title"],
      ["brandModel", "Brand / Model"],
      ["category", "Category"],
      ["description", "Description"],
      ["condition", "Product condition"],
      ["purchaseDate", "Date of product buy"],
      ["purchasedBy", "Purchased by"],
      ["purchasePrice", "Original purchase price"],
      ["startingPrice", "Starting bid"],
      ["auctionStart", "Auction start"],
      ["auctionEnd", "Auction end"],
      ["locationArea", "Area / Locality"],
      ["locationCity", "City"],
      ["locationState", "State"],
      ["locationCountry", "Country"],
      ["locationPincode", "Pincode"],
      ["deliveryType", "Delivery / Pickup"],
      ["shippingType", "Shipping type"],
      ["paymentMethod", "Payment method"],
      ["productTerms", "Seller Terms & Conditions"],
      ["sellerName", "Seller name"],
      ["sellerEmail", "Seller email"],
      ["sellerContact", "Contact number"],
    ];

    for (const [field, label] of requiredFields) {
      if (!String(formData[field] ?? "").trim()) {
        setSubmitError(`${label} is required.`);
        return;
      }
    }

    // =========================================================
    // IMAGE / DOCUMENT VALIDATION
    // =========================================================

    if (images.length < 3) {
      setSubmitError("Please upload at least 3 product images.");
      return;
    }

    if (images.length > 12) {
      setSubmitError("You can upload a maximum of 12 product images.");
      return;
    }

    if (!purchaseProof) {
      setSubmitError("Please upload the bill or proof of purchase.");
      return;
    }

    if (!sellerProof) {
      setSubmitError("Please upload seller verification proof.");
      return;
    }

    const documentTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];

    const documentMaxSize = 10 * 1024 * 1024;

    if (!documentTypes.includes(purchaseProof.type)) {
      setSubmitError("Purchase proof must be JPG, JPEG, PNG or PDF.");
      return;
    }

    if (purchaseProof.size > documentMaxSize) {
      setSubmitError("Purchase proof cannot exceed 10MB.");
      return;
    }

    if (!documentTypes.includes(sellerProof.type)) {
      setSubmitError(
        "Seller verification proof must be JPG, JPEG, PNG or PDF."
      );
      return;
    }

    if (sellerProof.size > documentMaxSize) {
      setSubmitError("Seller verification proof cannot exceed 10MB.");
      return;
    }

    // =========================================================
    // MAX LENGTH VALIDATION - MATCHES MYSQL
    // =========================================================

    const lengthRules = [
      ["productTitle", 100, "Auction title"],
      ["brandModel", 100, "Brand / Model"],
      ["description", 1000, "Description"],
      ["purchasedBy", 100, "Purchased by"],
      ["locationArea", 100, "Area / Locality"],
      ["locationCity", 50, "City"],
      ["locationState", 50, "State"],
      ["locationCountry", 50, "Country"],
      ["sellerName", 100, "Seller name"],
      ["sellerEmail", 255, "Seller email"],
    ];

    for (const [field, max, label] of lengthRules) {
      if (formData[field].trim().length > max) {
        setSubmitError(`${label} cannot exceed ${max} characters.`);
        return;
      }
    }

    if (formData.productTerms.trim().length > 5000) {
      setSubmitError(
        "Seller Terms & Conditions cannot exceed 5000 characters."
      );
      return;
    }

    // =========================================================
    // CHARACTER VALIDATION
    // =========================================================

    const textNameFields = [
      ["purchasedBy", "Purchased by"],
      ["sellerName", "Seller name"],
      ["locationCity", "City"],
      ["locationState", "State"],
      ["locationCountry", "Country"],
    ];

    for (const [field, label] of textNameFields) {
      if (!/^[A-Za-z][A-Za-z\s'-]*$/.test(formData[field].trim())) {
        setSubmitError(
          `${label} can contain only letters, spaces, apostrophe and hyphen.`
        );
        return;
      }
    }

    // =========================================================
    // PINCODE / CONTACT
    // =========================================================

    if (!/^\d{6}$/.test(formData.locationPincode)) {
      setSubmitError("Pincode must contain exactly 6 digits.");
      return;
    }

    if (!/^\d{10}$/.test(formData.sellerContact)) {
      setSubmitError("Contact number must contain exactly 10 digits.");
      return;
    }

    // =========================================================
    // EMAIL
    // =========================================================

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!emailRegex.test(formData.sellerEmail.trim())) {
      setSubmitError("Please enter a valid seller email address.");
      return;
    }

    // =========================================================
    // PRICE VALIDATION
    // =========================================================

    const purchasePrice = Number(formData.purchasePrice);
    const startingPrice = Number(formData.startingPrice);

    if (!Number.isFinite(purchasePrice) || purchasePrice <= 0) {
      setSubmitError("Original purchase price must be greater than 0.");
      return;
    }

    if (!Number.isFinite(startingPrice) || startingPrice <= 0) {
      setSubmitError("Starting bid must be greater than 0.");
      return;
    }

    if (purchasePrice > 9999999999.99) {
      setSubmitError("Original purchase price is too large.");
      return;
    }

    if (startingPrice > 9999999999.99) {
      setSubmitError("Starting bid is too large.");
      return;
    }

    // =========================================================
    // SHIPPING VALIDATION
    // =========================================================

    let shippingCharges = "0";

    if (formData.shippingType === "paid") {
      if (!formData.shippingCharges.trim()) {
        setSubmitError("Please enter the shipping charges.");
        return;
      }

      const charges = Number(formData.shippingCharges);

      if (!Number.isFinite(charges) || charges < 0) {
        setSubmitError("Shipping charges must be a valid number.");
        return;
      }

      if (charges > 9999999999.99) {
        setSubmitError("Shipping charges are too large.");
        return;
      }

      if (!formData.shippingPaidBy) {
        setSubmitError("Please select who will pay the shipping charges.");
        return;
      }

      shippingCharges = String(charges);
    }

    // =========================================================
    // DATE VALIDATION
    // =========================================================

    const purchaseDate = new Date(
      `${formData.purchaseDate}T00:00:00`
    );

    const auctionStart = new Date(formData.auctionStart);
    const auctionEnd = new Date(formData.auctionEnd);

    if (Number.isNaN(purchaseDate.getTime())) {
      setSubmitError("Please select a valid purchase date.");
      return;
    }

    if (Number.isNaN(auctionStart.getTime())) {
      setSubmitError("Please select a valid auction start date and time.");
      return;
    }

    if (Number.isNaN(auctionEnd.getTime())) {
      setSubmitError("Please select a valid auction end date and time.");
      return;
    }

    if (auctionEnd <= auctionStart) {
      setSubmitError(
        "Auction end date and time must be after the start date and time."
      );
      return;
    }
    const now = new Date();

if (auctionStart <= now) {
  setSubmitError(
    "Auction start date and time must be in the future."
  );
  return
}

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (purchaseDate > today) {
      setSubmitError("Purchase date cannot be in the future.");
      return;
    }

    // =========================================================
    // TERMS
    // =========================================================

    if (!formData.productTerms.trim()) {
      setSubmitError("Please add your Seller Terms & Conditions.");
      return;
    }

    if (!formData.termsAccepted) {
      setSubmitError(
        "Please accept the Seller Terms & Conditions before creating the auction."
      );
      return;
    }

    if (!formData.paymentMethod) {
      setSubmitError("Please select a payment method.");
      return;
    }

    // =========================================================
    // GET JWT TOKEN
    // =========================================================

    const storedUser = localStorage.getItem("user");
    let user = null;

    try {
      user = storedUser ? JSON.parse(storedUser) : null;
    } catch {
      user = null;
    }

    const accessToken =
      localStorage.getItem("access_token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token") ||
      user?.access_token ||
      user?.accessToken ||
      user?.token;

    if (!accessToken) {
      setSubmitError(
        "Your login session is missing. Please login again before creating an auction."
      );
      return;
    }

    // =========================================================
    // CREATE MULTIPART FORM DATA
    // =========================================================

    const data = new FormData();

    data.append("product_title", formData.productTitle.trim());
    data.append("brand_model", formData.brandModel.trim());
    data.append("category", formData.category);
    data.append("description", formData.description.trim());
    data.append("product_condition", formData.condition);
    data.append("purchase_date", formData.purchaseDate);
    data.append("purchased_by", formData.purchasedBy.trim());
    data.append("purchase_price", purchasePrice.toFixed(2));
    data.append("starting_price", startingPrice.toFixed(2));
    data.append("auction_start", formData.auctionStart);
    data.append("auction_end", formData.auctionEnd);
    data.append("location_area", formData.locationArea.trim());
    data.append("location_city", formData.locationCity.trim());
    data.append("location_state", formData.locationState.trim());
    data.append("location_country", formData.locationCountry.trim());
    data.append("location_pincode", formData.locationPincode);
    data.append("delivery_type", formData.deliveryType);
    data.append("shipping_type", formData.shippingType);
    data.append("shipping_charges", shippingCharges);

    if (formData.shippingPaidBy) {
      data.append("shipping_paid_by", formData.shippingPaidBy);
    }

    if (formData.warrantyStatus) {
      data.append("warranty_status", formData.warrantyStatus);
    }

    data.append("payment_method", formData.paymentMethod);
    data.append("product_terms", formData.productTerms.trim());
    data.append("terms_accepted", String(formData.termsAccepted));
    data.append("seller_name", formData.sellerName.trim());
    data.append(
      "seller_email",
      formData.sellerEmail.trim().toLowerCase()
    );
    data.append("seller_contact", formData.sellerContact);

    images.forEach((image) => {
      data.append("images", image.file, image.file.name);
    });

    data.append(
      "purchase_proof",
      purchaseProof,
      purchaseProof.name
    );

    data.append(
      "seller_proof",
      sellerProof,
      sellerProof.name
    );

    // =========================================================
    // SEND TO FASTAPI
    // =========================================================

    try {
      setSubmitLoading(true);

      const response = await fetch(
        "http://127.0.0.1:8000/api/auctions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: data,
        }
      );

      let result = {};

      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok) {
        console.error("CREATE AUCTION ERROR:", result);

        let message =
          result?.detail ||
          result?.message ||
          "Unable to create auction.";

        if (Array.isArray(result?.detail)) {
          message = result.detail
            .map((item) => {
              const location = item?.loc
                ? item.loc.join(".")
                : "Field";

              return `${location}: ${
                item?.msg || "Invalid value."
              }`;
            })
            .join(" ");
        }

        if (response.status === 401) {
          message =
            "Your login session has expired or is invalid. Please login again.";
        }

        setSubmitError(message);
        return;
      }

      // =======================================================
      // SUCCESS - ONLY AFTER FASTAPI RETURNS SUCCESS
      // =======================================================

      setSubmitSuccess(
        result?.message ||
          "Auction submitted successfully and is waiting for admin approval."
      );

      alert(
        result?.message ||
          "Auction submitted successfully and is waiting for admin approval."
      );

      console.log("Auction created successfully:", result);

      images.forEach((image) => {
        if (image?.preview) {
          URL.revokeObjectURL(image.preview);
        }
      });

      setImages([]);
      setPurchaseProof(null);
      setSellerProof(null);

      setFormData({
        productTitle: "",
        brandModel: "",
        category: "",
        description: "",
        condition: "",
        purchaseDate: "",
        purchasedBy: "",
        purchasePrice: "",
        startingPrice: "",
        auctionStart: "",
        auctionEnd: "",
        locationArea: "",
        locationCity: "",
        locationState: "",
        locationCountry: "India",
        locationPincode: "",
        deliveryType: "pickup",
        shippingType: "free",
        shippingCharges: "",
        shippingPaidBy: "",
        warrantyStatus: "",
        paymentMethod: "",
        productTerms: "",
        termsAccepted: false,
        sellerName: "",
        sellerEmail: "",
        sellerContact: "",
      });

    } catch (error) {
      console.error("CREATE AUCTION REQUEST ERROR:", error);

      setSubmitError(
        "Unable to connect to the server. Please make sure FastAPI is running on http://127.0.0.1:8000."
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  /* =====================================================
     SAVE DRAFT
  ===================================================== */

  const saveDraft = () => {
    console.log(
      "Draft:",
      formData
    );

    alert(
      "Auction saved as draft."
    );
  };

  /* =========================================================
     OPEN SELLER TERMS POPUP
  ========================================================= */

  const openTermsModal = () => {
    setSellerTermsText(
      formData.productTerms || ""
    );

    setTermsModalOpen(true);
  };

  /* =========================================================
     CLOSE SELLER TERMS POPUP
  ========================================================= */

  const closeTermsModal = () => {
    setTermsModalOpen(false);
  };

  /* =========================================================
     SAVE SELLER TERMS
  ========================================================= */

  const saveSellerTerms = () => {
    const trimmedTerms =
      sellerTermsText.trim();

    if (!trimmedTerms) {
      alert(
        "Please enter your Terms & Conditions."
      );

      return;
    }

    setFormData((prev) => ({
      ...prev,

      productTerms:
        trimmedTerms,

      /*
        If seller changes the terms,
        previous acceptance is removed.
        Seller must accept the updated
        terms again.
      */
      termsAccepted: false,
    }));

    setTermsModalOpen(false);
  };

  return (
    <div className="ca-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="ca-header">

        <div className="ca-header-content">

          <div className="ca-breadcrumb">
            <span>Dashboard</span>
            <b>•</b>
            <span>Auctions</span>
            <b>•</b>
            <strong>
              Create Auction
            </strong>
          </div>

          <h1>
            Create Auction
          </h1>

          <p>
            Create a new auction by adding
            your product details, images,
            pricing and seller information.
          </p>

        </div>

        <div className="ca-header-actions">

          <button
            type="button"
            className="ca-btn ca-btn-light"
            onClick={saveDraft}
          >
            Save Draft
          </button>

          <button
            type="submit"
            form="ca-auction-form"
            className="ca-btn ca-btn-primary"
          >
            + Publish Auction
          </button>

        </div>

      </header>

      {/* =================================================
          MAIN FORM
      ================================================= */}

      <form
        id="ca-auction-form"
        className="ca-form"
        onSubmit={handleSubmit}
      >

        {/* =================================================
            TOP TWO COLUMN AREA
        ================================================= */}

        <div className="ca-main-card">

          {/* =================================================
              LEFT - IMAGES
          ================================================= */}

          <section className="ca-image-section">

            <div className="ca-section-heading">

              <div className="ca-heading-icon">
                ▧
              </div>

              <div>
                <h2>
                  Upload Images
                </h2>

                <p>
                  Add high quality images
                  of your product
                </p>
              </div>

            </div>

            <label className="ca-upload-box">

              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp"
                onChange={
                  handleImageUpload
                }
              />

              <div className="ca-upload-icon">
                ↑
              </div>

              <h3>
                Drag & drop images here
              </h3>

              <span className="ca-upload-or">
                or
              </span>

              <span className="ca-browse-btn">
                Browse Files
              </span>

              <p>
                JPG, PNG or WEBP
                (Max. 5MB each)
              </p>

            </label>

            <div className="ca-preview-header">

              <div>

                <span className="ca-preview-icon">
                  ▣
                </span>

                <strong>
                  Image Preview
                </strong>

              </div>

              <span>
                {images.length}/12
              </span>

            </div>

            {images.length > 0 ? (

              <div className="ca-image-grid">

                {images.map(
                  (image, index) => (

                    <div
                      className="ca-image-item"
                      key={`${image.name}-${index}`}
                    >

                      <img
                        src={
                          image.preview
                        }
                        alt={`Product ${
                          index + 1
                        }`}
                      />

                      {index === 0 && (
                        <span className="ca-cover-badge">
                          COVER
                        </span>
                      )}

                      <button
                        type="button"
                        className="ca-remove-image"
                        onClick={() =>
                          removeImage(
                            index
                          )
                        }
                      >
                        ×
                      </button>

                    </div>

                  )
                )}

              </div>

            ) : (

              <div className="ca-empty-preview">
                Images will appear here
                after uploading
              </div>

            )}

            <div className="ca-image-note">

              <span>ⓘ</span>

              <p>
                You can upload up to 12
                product images. Minimum
                3 images are required.
              </p>

            </div>

          </section>

          {/* =================================================
              RIGHT - AUCTION DETAILS
          ================================================= */}

          <section className="ca-details-section">

            <div className="ca-section-heading">

              <div className="ca-heading-icon">
                №
              </div>

              <div>

                <h2>
                  Auction Details
                </h2>

                <p>
                  Fill in the details to
                  create a new auction
                </p>

              </div>

            </div>

            <div className="ca-field-grid">

              <div className="ca-field">

                <label>
                  Auction Title
                  <span>*</span>
                </label>

                <div className="ca-input-wrap">

                  <span className="ca-input-icon">
                    ◇
                  </span>

                  <input
                    type="text"
                    name="productTitle"
                    value={
                      formData.productTitle
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter auction title"
                    required
                  />

                </div>

              </div>

              <div className="ca-field">

                <label>
                  Brand / Model
                  <span>*</span>
                </label>

                <div className="ca-input-wrap">

                  <span className="ca-input-icon">
                    ◇
                  </span>

                  <input
                    type="text"
                    name="brandModel"
                    value={
                      formData.brandModel
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="e.g. Apple iPhone 15 Pro"
                    required
                  />

                </div>

              </div>

            </div>

            <div className="ca-field-grid">

              <div className="ca-field">

                <label>
                  Category
                  <span>*</span>
                </label>

                <CustomSelect
                  name="category"
                  value={
                    formData.category
                  }
                  onChange={
                    handleSelectChange
                  }
                  options={
                    CATEGORY_OPTIONS
                  }
                  placeholder="Select category"
                  icon="▦"
                  required
                />

              </div>

              <div className="ca-field">

                <label>
                  Product Condition
                  <span>*</span>
                </label>

                <CustomSelect
                  name="condition"
                  value={
                    formData.condition
                  }
                  onChange={
                    handleSelectChange
                  }
                  options={
                    CONDITION_OPTIONS
                  }
                  placeholder="Select condition"
                  required
                />

              </div>

            </div>

            <div className="ca-field">

              <label>
                Warranty Status
              </label>

              <CustomSelect
                name="warrantyStatus"
                value={
                  formData.warrantyStatus
                }
                onChange={
                  handleSelectChange
                }
                options={
                  WARRANTY_OPTIONS
                }
                placeholder="Select warranty status"
              />

            </div>

            <div className="ca-field ca-field-full">

              <div className="ca-label-row">

                <label>
                  Description
                  <span>*</span>
                </label>

                <small>
                  {
                    formData.description
                      .length
                  }
                  /1000
                </small>

              </div>

              <textarea
                name="description"
                value={
                  formData.description
                }
                onChange={
                  handleChange
                }
                maxLength="1000"
                placeholder="Enter product description, condition, features, accessories and other important information..."
                required
              />

            </div>

            <div className="ca-price-grid">

              <div className="ca-field">

                <label>
                  Starting Bid (₹)
                  <span>*</span>
                </label>

                <div className="ca-input-wrap">

                  <span className="ca-currency">
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    name="startingPrice"
                    value={
                      formData.startingPrice
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter starting bid"
                    required
                  />

                </div>

              </div>

              <div className="ca-field">

                <label>
                  Original Purchase Price (₹)
                  <span>*</span>
                </label>

                <div className="ca-input-wrap">

                  <span className="ca-currency">
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    name="purchasePrice"
                    value={
                      formData.purchasePrice
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter purchase price"
                    required
                  />

                </div>

              </div>

            </div>

            <div className="ca-field-grid">

              <div className="ca-field">

                <label>
                  Start Date & Time
                  <span>*</span>
                </label>

                <CustomDateField
                  name="auctionStart"
                  mode="datetime"
                  value={
                    formData.auctionStart
                  }
                  onChange={
                    handleSelectChange
                  }
                  placeholder="Select start date & time"
                  required
                />

              </div>

              <div className="ca-field">

                <label>
                  End Date & Time
                  <span>*</span>
                </label>

                <CustomDateField
                  name="auctionEnd"
                  mode="datetime"
                  value={
                    formData.auctionEnd
                  }
                  onChange={
                    handleSelectChange
                  }
                  placeholder="Select end date & time"
                  required
                />

              </div>

            </div>

          </section>

        </div>

        {/* =================================================
            ADDITIONAL INFORMATION
        ================================================= */}

        <div className="ca-bottom-grid">

          {/* =================================================
              PURCHASE INFORMATION
          ================================================= */}

          <section className="ca-card">

            <div className="ca-card-heading">

              <div className="ca-small-icon">
                ✓
              </div>

              <div>

                <h2>
                  Purchase Information
                </h2>

                <p>
                  Original purchase and
                  ownership details
                </p>

              </div>

            </div>

            <div className="ca-field-grid">

              <div className="ca-field">

                <label>
                  Date of Product Buy
                  <span>*</span>
                </label>

                <CustomDateField
                  name="purchaseDate"
                  mode="date"
                  value={
                    formData.purchaseDate
                  }
                  onChange={
                    handleSelectChange
                  }
                  placeholder="Select date"
                  required
                />

              </div>

              <div className="ca-field">

                <label>
                  Purchased By
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="purchasedBy"
                  value={
                    formData.purchasedBy
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Name of original buyer"
                  required
                />

              </div>

            </div>

            <div className="ca-document-box">

              <div>

                <strong>
                  Bill / Proof of Purchase
                </strong>

                <p>
                  Upload original bill,
                  invoice or ownership proof.
                </p>

              </div>

              <label className="ca-upload-document">

                + Upload

                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) =>
                    setPurchaseProof(
                      e.target.files?.[0] ||
                        null
                    )
                  }
                />

              </label>

            </div>

            {purchaseProof && (
              <div className="ca-file-name">
                ✓ {purchaseProof.name}
              </div>
            )}

          </section>

          {/* =================================================
              DELIVERY & SHIPPING
          ================================================= */}

          <section className="ca-card">

            <div className="ca-card-heading">

              <div className="ca-small-icon">
                ⇄
              </div>

              <div>

                <h2>
                  Delivery & Shipping
                </h2>

                <p>
                  Choose how the buyer
                  receives the product
                </p>

              </div>

            </div>

            <div className="ca-field">

              <label>
                Delivery / Pickup
                <span>*</span>
              </label>

              <div className="ca-choice-grid">

                {[
                  [
                    "pickup",
                    "Pickup Only",
                    "Buyer collects the product",
                  ],
                  [
                    "delivery",
                    "Delivery",
                    "Seller ships the product",
                  ],
                  [
                    "both",
                    "Both",
                    "Pickup or delivery",
                  ],
                ].map(
                  ([
                    value,
                    title,
                    text,
                  ]) => (

                    <button
                      key={value}
                      type="button"
                      className={
                        formData.deliveryType ===
                        value
                          ? "ca-choice active"
                          : "ca-choice"
                      }
                      onClick={() =>
                        setFormData(
                          (prev) => ({
                            ...prev,
                            deliveryType:
                              value,
                          })
                        )
                      }
                    >

                      <strong>
                        {title}
                      </strong>

                      <small>
                        {text}
                      </small>

                    </button>

                  )
                )}

              </div>

            </div>

            <div className="ca-field">

              <label>
                Shipping Charges
                <span>*</span>
              </label>

              <div className="ca-radio-grid">

                <label
                  className={
                    formData.shippingType ===
                    "free"
                      ? "ca-radio active"
                      : "ca-radio"
                  }
                >

                  <input
                    type="radio"
                    name="shippingType"
                    value="free"
                    checked={
                      formData.shippingType ===
                      "free"
                    }
                    onChange={
                      handleChange
                    }
                  />

                  <div>

                    <strong>
                      Free Shipping
                    </strong>

                    <small>
                      No shipping charge
                    </small>

                  </div>

                </label>

                <label
                  className={
                    formData.shippingType ===
                    "paid"
                      ? "ca-radio active"
                      : "ca-radio"
                  }
                >

                  <input
                    type="radio"
                    name="shippingType"
                    value="paid"
                    checked={
                      formData.shippingType ===
                      "paid"
                    }
                    onChange={
                      handleChange
                    }
                  />

                  <div>

                    <strong>
                      Paid Shipping
                    </strong>

                    <small>
                      Additional shipping cost
                    </small>

                  </div>

                </label>

              </div>

            </div>

            {formData.shippingType ===
              "paid" && (

              <div className="ca-field-grid">

                <div className="ca-field">

                  <label>
                    Shipping Charges (₹)
                  </label>

                  <input
                    type="number"
                    min="0"
                    name="shippingCharges"
                    value={
                      formData.shippingCharges
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="e.g. 500"
                  />

                </div>

                <div className="ca-field">

                  <label>
                    Charges Paid By
                  </label>

                  <CustomSelect
                    name="shippingPaidBy"
                    value={
                      formData.shippingPaidBy
                    }
                    onChange={
                      handleSelectChange
                    }
                    options={
                      SHIPPING_PAID_BY_OPTIONS
                    }
                    placeholder="Select"
                  />

                </div>

              </div>

            )}

          </section>

          {/* =================================================
              SELLER DETAILS + LOCATION
          ================================================= */}

          <section className="ca-card">

            <div className="ca-card-heading">

              <div className="ca-small-icon">
                ◉
              </div>

              <div>

                <h2>
                  Seller Details
                </h2>

                <p>
                  Seller contact, location
                  and verification information
                </p>

              </div>

            </div>

            <div className="ca-field">

              <label>
                Seller Name
                <span>*</span>
              </label>

              <input
                type="text"
                name="sellerName"
                value={
                  formData.sellerName
                }
                onChange={
                  handleChange
                }
                placeholder="Enter seller full name"
                required
              />

            </div>

            <div className="ca-field-grid">

              <div className="ca-field">

                <label>
                  Email Address
                  <span>*</span>
                </label>

                <input
                  type="email"
                  name="sellerEmail"
                  value={
                    formData.sellerEmail
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="seller@example.com"
                  required
                />

              </div>

              <div className="ca-field">

                <label>
                  Contact Number
                  <span>*</span>
                </label>

                <input
                  type="tel"
                  name="sellerContact"
                  value={
                    formData.sellerContact
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="+91 98765 43210"
                  required
                />

              </div>

            </div>

            <div className="ca-field">

              <label>
                Area / Locality
                <span>*</span>
              </label>

              <input
                type="text"
                name="locationArea"
                value={
                  formData.locationArea
                }
                onChange={
                  handleChange
                }
                placeholder="e.g. Satellite Road"
                required
              />

            </div>

            <div className="ca-field-grid">

              <div className="ca-field">

                <label>
                  City
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="locationCity"
                  value={
                    formData.locationCity
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Ahmedabad"
                  required
                />

              </div>

              <div className="ca-field">

                <label>
                  State
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="locationState"
                  value={
                    formData.locationState
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Gujarat"
                  required
                />

              </div>

            </div>

            <div className="ca-field-grid">

              <div className="ca-field">

                <label>
                  Country
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="locationCountry"
                  value={
                    formData.locationCountry
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="India"
                  required
                />

              </div>

              <div className="ca-field">

                <label>
                  Pincode
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="locationPincode"
                  value={
                    formData.locationPincode
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="380015"
                  maxLength="6"
                  pattern="[0-9]{6}"
                  required
                />

              </div>

            </div>

            <div className="ca-document-box">

              <div>

                <strong>
                  Seller Verification Proof
                </strong>

                <p>
                  Upload identity or ownership
                  verification document.
                </p>

              </div>

              <label className="ca-upload-document">

                + Upload

                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) =>
                    setSellerProof(
                      e.target.files?.[0] ||
                        null
                    )
                  }
                />

              </label>

            </div>

            {sellerProof && (
              <div className="ca-file-name">
                ✓ {sellerProof.name}
              </div>
            )}

          </section>

          {/* =================================================
              PAYMENT + SELLER TERMS
          ================================================= */}

          <section className="ca-card ca-payment-card">

            <div className="ca-card-heading">

              <div className="ca-small-icon">
                ₹
              </div>

              <div>

                <h2>
                  Payment Method
                </h2>

                <p>
                  Select accepted payment
                  method
                </p>

              </div>

            </div>

            <div className="ca-payment-grid">

              {[
                "UPI",
                "Bank Transfer",
                "Credit / Debit Card",
                "Cash on Pickup",
              ].map(
                (method) => (

                  <button
                    type="button"
                    key={method}
                    className={
                      formData.paymentMethod ===
                      method
                        ? "ca-payment active"
                        : "ca-payment"
                    }
                    onClick={() =>
                      setFormData(
                        (prev) => ({
                          ...prev,
                          paymentMethod:
                            method,
                        })
                      )
                    }
                  >
                    {method}
                  </button>

                )
              )}

            </div>

            {/* =================================================
                SELLER TERMS & CONDITIONS
                POPUP TRIGGER
            ================================================= */}

            <div className="ca-field ca-product-terms">

              <div className="ca-label-row">

                <label>
                  Seller Terms & Conditions
                  <span>*</span>
                </label>

              </div>

              {/* POPUP OPEN BUTTON */}

              <button
                type="button"
                className={`ca-terms-input ${
                  formData.productTerms
                    ? "ca-terms-filled"
                    : ""
                }`}
                onClick={
                  openTermsModal
                }
              >

                <span>
                  {formData.productTerms
                    ? "Edit Seller Terms & Conditions"
                    : "Add Seller Terms & Conditions"}
                </span>

                <span className="ca-terms-arrow">
                  →
                </span>

              </button>

              {/* SAVED TERMS PREVIEW */}

              {formData.productTerms && (
                <div className="ca-seller-terms-preview">

                  <div className="ca-seller-terms-preview-header">

                    <strong>
                      Your Terms & Conditions
                    </strong>

                    <button
                      type="button"
                      onClick={
                        openTermsModal
                      }
                    >
                      Edit
                    </button>

                  </div>

                  <p>
                    {
                      formData.productTerms
                    }
                  </p>

                </div>
              )}

            </div>

          </section>

        </div>

        {/* =================================================
            SELLER TERMS & CONDITIONS POPUP
        ================================================= */}

        {termsModalOpen && (

          <div
            className="ca-terms-overlay"
            onMouseDown={(e) => {
              if (
                e.target ===
                e.currentTarget
              ) {
                closeTermsModal();
              }
            }}
          >

            <div
              className="ca-terms-modal ca-seller-terms-modal"
              onMouseDown={(e) =>
                e.stopPropagation()
              }
            >

              {/* MODAL HEADER */}

              <div className="ca-terms-modal-header">

                <div>

                  <h2>
                    Seller Terms & Conditions
                  </h2>

                  <p>
                    Add the terms and conditions
                    that buyers must agree to
                    when purchasing your product.
                  </p>

                </div>

                <button
                  type="button"
                  className="ca-terms-close"
                  onClick={
                    closeTermsModal
                  }
                  aria-label="Close"
                >
                  ×
                </button>

              </div>

              {/* TERMS EDITOR */}

              <div className="ca-seller-terms-editor">

                <label>
                  Your Terms & Conditions
                  <span>*</span>
                </label>

                <textarea
                  value={
                    sellerTermsText
                  }
                  onChange={(e) =>
                    setSellerTermsText(
                      e.target.value
                    )
                  }
                  placeholder={
                    "Enter your terms and conditions here...\n\n" +
                    "Example:\n" +
                    "1. Product will be sold in its current condition.\n" +
                    "2. Buyer must inspect the product before pickup.\n" +
                    "3. No returns will be accepted after the transaction.\n" +
                    "4. Payment must be completed using the selected payment method."
                  }
                  maxLength={5000}
                  autoFocus
                />

                <div className="ca-terms-character-count">
                  {
                    sellerTermsText.length
                  }
                  /5000
                </div>

              </div>

              {/* MODAL FOOTER */}

              <div className="ca-terms-modal-footer">

                <button
                  type="button"
                  className="ca-terms-cancel"
                  onClick={
                    closeTermsModal
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="ca-terms-agree"
                  onClick={
                    saveSellerTerms
                  }
                >
                  Save Terms
                </button>

              </div>

            </div>

          </div>

        )}

        {/* =================================================
            SUBMIT MESSAGE
        ================================================= */}

        {(submitError || submitSuccess) && (
          <div
            style={{
              margin: "0 0 16px",
              padding: "12px 16px",
              borderRadius: "10px",
              fontSize: "14px",
              lineHeight: "1.5",
              background: submitError ? "#fff1f2" : "#ecfdf5",
              color: submitError ? "#b42318" : "#067647",
              border: submitError
                ? "1px solid #fecdd3"
                : "1px solid #a7f3d0",
            }}
            role="alert"
          >
            {submitError || submitSuccess}
          </div>
        )}

        {/* =================================================
            FORM FOOTER
        ================================================= */}

        <div className="ca-form-footer">

          <div className="ca-footer-info">

            <label className="ca-terms-checkbox">

              <input
                type="checkbox"
                checked={
                  formData.termsAccepted
                }
                onChange={(e) => {

                  if (
                    !formData.productTerms
                  ) {
                    alert(
                      "Please add Seller Terms & Conditions first."
                    );

                    return;
                  }

                  setFormData(
                    (prev) => ({
                      ...prev,
                      termsAccepted:
                        e.target.checked,
                    })
                  );

                }}
              />

              <span className="ca-custom-checkbox">

                {formData.termsAccepted &&
                  "✓"}

              </span>

              <span className="ca-terms-text">

                I agree to the{" "}

                <button
                  type="button"
                  className="ca-terms-link"
                  onClick={
                    openTermsModal
                  }
                >
                  Seller Terms & Conditions
                </button>

                {" "}and confirm that
                all information provided
                is accurate.

              </span>

            </label>

          </div>

          <div className="ca-footer-actions">

            <button
              type="button"
              className="ca-btn ca-btn-light ca-cancel"
              onClick={
                saveDraft
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="ca-btn ca-btn-primary ca-publish"
              disabled={
                !formData.termsAccepted ||
                submitLoading
              }
            >
              {submitLoading ? "Submitting..." : "+ Create Auction"}
            </button>

          </div>

        </div>

      </form>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="ca-footer">

        <span>
          © 2026 Bidora. All rights reserved.
        </span>

        <span>
          Seller Console · Create Auction
        </span>

      </footer>

    </div>
  );
};

export default CreateAuction;