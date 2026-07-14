#!/usr/bin/env node
/**
 * Durable, idempotent patches for @sam-ael/medusa-plugin-shiprocket.
 * Runs on `postinstall` so the changes survive `npm install` (which would
 * otherwise overwrite node_modules). Safe to run repeatedly and safe if the
 * plugin isn't installed.
 *
 * Patch 1 — SHIPROCKET_SKIP_AWB: create the order on Shiprocket (free) but skip
 *   AWB assignment + pickup (which need a funded wallet) when the env flag is
 *   "true". The order still shows under Shiprocket "New Orders".
 *
 * Patch 2 — phone normalisation: strip a leading Indian country code (`91`) or
 *   trunk `0` so numbers stored as `+919373105785` pass Shiprocket's strict
 *   "must be 10 digits" check. Without this, orders whose phone includes `+91`
 *   (the storefront default) are rejected.
 */
const fs = require("fs");
const path = require("path");

const BASE =
  "@sam-ael/medusa-plugin-shiprocket/.medusa/server/src/providers/shiprocket";
const root = path.join(__dirname, "..", "node_modules");

function patchFile(relPath, alreadyMarker, anchor, replacement, label) {
  const target = path.join(root, BASE, relPath);
  if (!fs.existsSync(target)) return; // plugin not installed — skip silently
  let src = fs.readFileSync(target, "utf8");
  if (src.includes(alreadyMarker)) return; // already patched
  if (!src.includes(anchor)) {
    console.warn(`[patch-shiprocket] anchor not found in ${relPath} — plugin version changed? skipping ${label}.`);
    return;
  }
  src = src.replace(anchor, replacement);
  fs.writeFileSync(target, src);
  console.log(`[patch-shiprocket] applied ${label}.`);
}

// Patch 1: SKIP_AWB early return after order creation.
patchFile(
  "client/index.js",
  "SHIPROCKET_SKIP_AWB",
  'throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Shiprocket order created but no shipment ID returned");\n            }',
  'throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Shiprocket order created but no shipment ID returned");\n            }' +
    `
            // [bacoola patch] SHIPROCKET_SKIP_AWB: stop after creating the order
            // (free) and skip AWB assignment + pickup, which require a funded
            // wallet. The order still appears under Shiprocket "New Orders".
            if (process.env.SHIPROCKET_SKIP_AWB === "true") {
                return {
                    ...orderCreated.data,
                    awb: "",
                    tracking_number: "",
                    tracking_url: "",
                };
            }`,
  "SHIPROCKET_SKIP_AWB early-return"
);

// Patch 2: strip leading country code from phone numbers.
patchFile(
  "utils/validation.js",
  "bacoola-phone-normalise",
  '    const cleaned = phone.toString().replace(/[^0-9]/g, "");',
  '    // [bacoola-phone-normalise] strip leading +91 / 0 so 12-digit numbers pass\n' +
    '    let cleaned = phone.toString().replace(/[^0-9]/g, "");\n' +
    '    if (cleaned.length === 12 && cleaned.startsWith("91")) cleaned = cleaned.slice(2);\n' +
    '    else if (cleaned.length === 11 && cleaned.startsWith("0")) cleaned = cleaned.slice(1);',
  "phone country-code normalisation"
);
