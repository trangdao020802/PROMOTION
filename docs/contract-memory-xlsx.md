# Contract memory and XLSX downloads

Hub input reads are read-only. They do not update or delete Apollo Hub's Course info, prices, discounts, gift codes, payments or hours. Valid automatic inputs may update the corresponding Promotion fields; missing values retain earlier saved inputs, and manual patches take precedence. A fresh receiving CT's course inputs remain visible when an older report disagrees. Both source references and the blocking conflict remain available for verification.

## Memory and refresh

Course evidence is stored by `Contract tổng + Student ID`, with the student's name, center, exact Hub URL, source version, inputs and read diagnostics. Legacy CT-only entries migrate on write without removing existing datasets. Different students cannot share a stored course source accidentally.

Calculated row snapshots are separate from original records and manual edits. A snapshot is reused only when its dataset, CT/student, all course/offer inputs, source balances and movements, applicable voucher, policy, cutoff, dependency/review patches and calculator build revision match. The CT/student key identifies a record; it does not determine its price. Changed inputs invalidate an old calculation and cause recalculation. Matching saved rows appear during refresh while the calculator rebuilds; edits, export and new input reads wait for that recalculation.

Before reading each CT, the panel records the CT, student/name and exact last progress message. It stores checkpoints only after a CT's source was saved. Reload shows the last message as an interrupted previous run, rather than claiming a background task is still running. The user can continue and skip completed CTs. Refresh does not create or navigate a Hub tab. Memory is browser-local IndexedDB plus a small immediate progress note; it is not cross-device synchronization.

## Excel downloads

The filtered reconciliation export, captured Hub reports and policy update template are real `.xlsx` workbooks. Headers, filters, frozen first rows, wrapped text and row stripes make columns directly usable in Excel. Numeric amounts/hours are numeric cells with built-in **General** format, without a thousands separator embedded in their stored value. Student IDs, leading zeros and formula-looking notes remain text. Offer lists and trace notes use line breaks inside their own cells.

Hub report metadata has a separate `Nguồn` sheet. Transfer reports retain both `Amount` columns and their order; duplicate headings use a worksheet filter instead of an Excel Table, whose headings must be unique. Saved legacy CSV/TSV sources are converted on download; stored originals stay unchanged. Existing XLSX uploads and JSON backups remain supported.

The browser writer uses styles authored and rendered with Artifact Tool, native OOXML cells and local ZIP compression. Source files and generated downloads stay in the user's browser.

## Validation

Automated tests cover XLSX round trips, General numeric styles, identifiers, duplicate Transfer columns, policy template alignment, scoped memory, stale-result invalidation, partial input retention and interrupted progress restoration. Browser QA uses synthetic reports, changes Discount apply, saves and refreshes through the actual button, and verifies the retained inputs and recalculated totals. Private authenticated Hub records are not available in the QA browser; their network reads remain covered by synthetic fixtures.
