const fs = require('fs');
let c = fs.readFileSync('components/faturas/FaturaSAPModal.tsx', 'utf8');

// Use real local time for auto-completion (YYYY-MM-DDTHH:mm:ss)
c = c.replace(/new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]/g, "new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 19)");

// Now we need to make sure <Input type="date" value={formData.something || ""} /> only receives the YYYY-MM-DD part.
// Using a regex to replace `value={formData.X || ""}` with `value={formData.X?.substring(0, 10) || ""}` for date inputs.
// Since all date inputs are of type="date", we can just look for those.
const dateInputRegex = /<Input[^>]*type="date"[^>]*value=\{([^}]+)\}[^>]*>/g;
c = c.replace(dateInputRegex, (match, p1) => {
    // p1 could be `formData.data_emissao || ""` or `formData.nexa_rc_data || formData.data_rc_sap || ""`
    // Let's create a helper function at the top of the file if not exists, but wait, we can just replace `|| ""` with `?.substring(0, 10) || ""`?
    // Wait, if it's `formData.data_emissao || ""` it becomes `formData.data_emissao?.substring(0, 10) || ""`
    let val = p1;
    if (val.includes(' || ""')) {
        let varName = val.replace(' || ""', ''); // e.g. "formData.data_emissao"
        // Wait, for `formData.nexa_rc_data || formData.data_rc_sap`, it becomes complicated.
        // It's safer to just wrap the whole thing:
        // `value={(formData.something || "").substring(0, 10)}`
        return match.replace(`value={${p1}}`, `value={(${p1}).substring(0, 10)}`);
    } else {
        return match.replace(`value={${p1}}`, `value={(${p1} || "").substring(0, 10)}`);
    }
});

// Also, the previous SlaBadge format fix handled "Concluído em".
// But let's verify if there is any other place where the date is displayed with split('-').reverse().join('/')

fs.writeFileSync('components/faturas/FaturaSAPModal.tsx', c);
console.log("Updated FaturaSAPModal to use real time for completions and fix date inputs");
