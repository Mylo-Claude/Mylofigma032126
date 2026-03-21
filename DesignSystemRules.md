# Design System Rules

## Core Principles

### 1. Use ShadCN components by default
Only use native HTML controls if there's a specific performance or simplicity reason.

### 2. Match component types across panels
If Editor uses `<Select>`, Preview should too.

### 3. Use size variants consistently
Both panels should use `size="sm"` for toolbar controls.

### 4. Share the same base tokens
Never hardcode colors like `border-gray-300`, use theme tokens.

### 5. Check existing components first
Always search `/src/app/components/ui/` before using native elements.

---

## Practical Guidelines

### ❌ DON'T: Native select with hardcoded styles

```tsx
<select className="text-xs border border-gray-300 rounded px-2 py-1 bg-white">
  <option>Option</option>
</select>
```

### ✅ DO: ShadCN Select with size variant

```tsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger size="sm">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="opt">Option</SelectItem>
  </SelectContent>
</Select>
```

### ✅ ALSO OK: Match existing pattern if justified

```tsx
// (e.g., heading control needs custom typography)
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" size="sm">Trigger</Button>
  </PopoverTrigger>
  <PopoverContent>
    {/* custom content */}
  </PopoverContent>
</Popover>
```

---

## Available ShadCN Components

Check `/src/app/components/ui/` for the full list of available components including:

- `select.tsx` - Form-style dropdown selector
- `dropdown-menu.tsx` - Action/command menu
- `popover.tsx` - Custom interactive content in floating panel
- `button.tsx` - Button component with variants
- And many more...
