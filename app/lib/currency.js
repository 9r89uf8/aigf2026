// lib/currency.js
export const COUNTRY_TO_CURRENCY = {
    US: "USD",
    ES: "EUR",
    MX: "MXN",
    AR: "ARS",
};

export function currencyForCountry(country) {
    return COUNTRY_TO_CURRENCY[country?.toUpperCase()] || "USD";
}

// minor units -> display
export function formatMoney(ccy, minor) {
    const amountMinor =
        typeof minor === "number" ? Math.round(minor) : Math.round(Number(minor || 0));
    return `${(amountMinor / 100).toFixed(2)} ${ccy.toUpperCase()}`;
}
