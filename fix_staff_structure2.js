const fs = require('fs');
let c = fs.readFileSync('src/app/[firmSlug]/(app)/staff/page.tsx', 'utf8');

// The structure is:
//   ...
//   </div>  <- closes the outer padding div at line 307
//
//   {/* ── ADD STAFF MODAL ... */}  <- modals start here at 309
//   ...
//   </div>  <- closes page wrapper (should not be here before modals)
//   );
// }
//
// We need to move the outer </div> AFTER the modals.

// Strategy: find the outer </div> at line 307 that should be AFTER the modals
// The modals are between this </div> and the function end.
// We need to move </div>\n);\n} to AFTER the last modal closing

// Find the section to restructure
const badPattern = '    </div>\n\n      {/* ── ADD STAFF MODAL';
const goodPattern = '\n      {/* ── ADD STAFF MODAL';

if (c.includes(badPattern)) {
  // Remove the premature </div> and add it back at the end
  c = c.replace(badPattern, '\n      {/* ── ADD STAFF MODAL');
  
  // Now find the last modal closing and add the </div>\n  );\n} after it
  // The last modal ends with: </div>\n      )}\n    </div>\n  );\n}
  // which was added by our previous fix. Let's check...
  
  // Actually the modals were inserted by insert_modals.js which already has </div> );\n}\n at the end
  // So the structure should now be correct after removing the premature </div>
  console.log('Fixed!');
} else {
  // Try with CRLF
  const badPatternCRLF = '    </div>\r\n\r\n      {/* \u2500\u2500 ADD STAFF MODAL';
  if (c.includes(badPatternCRLF)) {
    c = c.replace(badPatternCRLF, '\r\n      {/* \u2500\u2500 ADD STAFF MODAL');
    console.log('Fixed with CRLF!');
  } else {
    // Debug: find the issue
    const lines = c.split('\n');
    for (let i = 305; i < 315; i++) {
      console.log(i+1, JSON.stringify(lines[i]));
    }
  }
}

fs.writeFileSync('src/app/[firmSlug]/(app)/staff/page.tsx', c);
