# Wanted Features

Features that have been planned but not yet implemented.

---

## Student bio expand/collapse

**Status:** Planned, not implemented

### Summary
Add a per-card expand toggle for `bioLong` on student cards, and an "Expand all / Collapse all" button for the student section. Uses vanilla JS only — no framework.

### Design decisions
- Cards grow taller when expanded (simple approach; `items-start` already prevents cross-row misalignment)
- "Expand all" toggles to "Collapse all" and back
- `bioLong` hidden by default with Tailwind `hidden` class
- Scoped to the student section only (not faculty/collabs)
- Works identically on both `/people` and the homepage

### Files to change

#### `src/components/PersonCard.astro`
- Accept `bioLong` in the `card` variant destructuring (already in the Props interface, not yet used in card variant)
- After the social icons row, add:
  ```html
  {bioLong && (
    <div>
      <p class="hidden text-xs text-gray-600 mt-1.5 leading-snug text-left" data-bio-long>{bioLong}</p>
      <button class="text-xs text-[#552d62] mt-1 hover:underline" data-expand-btn aria-expanded="false">▼ More</button>
    </div>
  )}
  ```
- Add a `<script>` inside the component to wire per-card toggle:
  ```js
  document.querySelectorAll('[data-expand-btn]').forEach(btn => {
    btn.addEventListener('click', () => {
      const bio = btn.previousElementSibling;
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      bio.classList.toggle('hidden', expanded);
      btn.setAttribute('aria-expanded', String(!expanded));
      btn.textContent = expanded ? '▼ More' : '▲ Less';
    });
  });
  ```

#### `src/pages/people.astro`
- Pass `bioLong={p.data.bioLong}` to student PersonCards
- Wrap the student grid in `<div data-student-section>`
- Add "Expand all" button above the grid:
  ```html
  <div class="flex justify-end mb-3">
    <button class="text-xs text-[#552d62] hover:underline" data-expand-all>Expand all</button>
  </div>
  ```
- Add inline `<script>` for the expand-all logic (see below)

#### `src/pages/index.astro`
- Same changes as `people.astro`: pass `bioLong`, wrap section, add button + script

### Expand-all script logic
```js
document.querySelectorAll('[data-expand-all]').forEach(btn => {
  btn.addEventListener('click', () => {
    const section = btn.closest('[data-student-section]');
    const bios = section.querySelectorAll('[data-bio-long]');
    const cardBtns = section.querySelectorAll('[data-expand-btn]');
    const expanding = btn.textContent.trim() === 'Expand all';
    bios.forEach(b => b.classList.toggle('hidden', !expanding));
    cardBtns.forEach(b => {
      b.setAttribute('aria-expanded', String(expanding));
      b.textContent = expanding ? '▲ Less' : '▼ More';
    });
    btn.textContent = expanding ? 'Collapse all' : 'Expand all';
  });
});
```

### Prerequisites
- The expand button only appears on cards where `bioLong` is filled. Currently only faculty have `bioLong` populated. Student `bioLong` fields would need to be added to their YAML files for the button to appear.

---
