# Receiving contracts, approvals and voucher profiles · bridge 1.6.14

## One approval section

The detail drawer's approval component and source-contract component had the same React sibling key. Saving/recalculating a row with transfer history could retain orphaned approval nodes. Their keys now have separate namespaces. The approval section also deduplicates condition IDs, identifies the current CT/student, shows applicable offer names and lists individual evidence requirements instead of joining them into an unreadable paragraph. Installment approval appears only for an exceeded-term exception or a previously approved exception.

Checkboxes retain their existing scoped review semantics. They do not authorize unrelated conditions or waive money, price, voucher, missing-value or policy checks. A partially cached row can render safely while refresh recalculation finishes.

## Course info after a center transfer

The receiving CT keeps priority. If its course is incomplete, course facts may come from source CTs that the existing funded Transfer graph has proved fully moved into that receiving CT, with the same Student ID and within the source cutoff. Matching a student alone does not create an inheritance relationship.

PaymentList, Export and saved Hub sources contribute evidence. Each donor CT must provide a complete, coherent course tuple compatible with any explicit receiving values. Different donor packages or offers remain unresolved with their source references. Receiving fields and manual edits retain priority. Applied offer/giftcode values can accompany an inherited course; a receiving CT with its own complete course and explicit no-offer values keeps those values.

Inherited fields name their donor CT and source references. The old CT stays in history/Payment info, while one master course and the existing cash/Transfer balance remain. No donated monetary total, invoice or approval is added as new funding. Pricing, voucher scope, dates and policy checks continue to run independently.

Bridge 1.6.14 recognizes an identity-verified empty `ListCourseInfo` response promptly as an empty course, rather than waiting for a course that does not exist. The web then reads verified source CT links through the same existing Hub-tab broker. Every read verifies its own CT/URL/student. No tab is created, navigated, activated or closed, and no Hub model is written. Parent and donor evidence are saved together; the local API rejects donors outside the validated Transfer relationship. Retry checkpoints require fresh complete inherited inputs; prior saved evidence stays available after a partial read.

## Voucher student is the current record

Student ID/name in the Contract voucher form come from the currently open student record and are read-only there. A voucher catalogue's creator, last-used student or cached profile is not the identity of every student whose Contract contains that full code. The full Giftcode and source URL still have to match the lookup, and type/value, center, dates and approval remain independently checked.

Voucher records now save under `full code | Student ID`. The selector prefers that student's scoped record and can migrate a matching legacy code-only record. Another student's saved rate/date/source definition can seed a new draft for the same full code, but its approval is not inherited. Empty import placeholders do not hide a more complete saved definition. Editing the new draft does not overwrite the previous student's record. Catalogue rows use distinct identity keys and remain independently editable. New reads fill identity from the current Contract profile, regardless of identity labels on the voucher catalogue page.

## Verification

284 automated tests cover proved/unproved/multi-hop transfers, donor conflicts, missing parent courses, background source reads, partial checkpoints, manual priority, cache invalidation, voucher profile assignment and per-student save isolation. Existing tab/no-navigation fixtures continue to pass. Browser QA imports three synthetic reports, verifies one receiving course and balance, toggles an approval without duplicating its section, and opens two students with the same voucher code to verify the correct read-only identity.

The user's private dataset is browser-local. The QA browser has no signed-in Hub tab, so Contract 727772 and private live voucher values have not been inspected directly. No private report or student evidence is part of the published source.
