const fs = require('fs');
let c = fs.readFileSync('src/app/[firmSlug]/(app)/staff/page.tsx', 'utf8');

// The modals are currently at lines 311-426, OUTSIDE the function closing.
// The function closes at line 307-309 (  );\n}\n\n)
// We need to:
// 1. Remove the premature close of StaffPage (lines 307-309) 
// 2. Move the modals INSIDE the return, before the </div>

// Find the premature function closing
const prematureClose = '    </div>\n  );\n}\n\n\n      {/* ── ADD STAFF MODAL ── */}';
const correctOpen = '    </div>\n\n      {/* ── ADD STAFF MODAL ── */}';

if (c.includes(prematureClose)) {
  c = c.replace(prematureClose, correctOpen);
  console.log('Fixed premature close!');
} else {
  console.log('Pattern not found, trying alternative...');
  // Try Windows line endings
  const prematureCloseWin = '    </div>\r\n  );\r\n}\r\n\r\n\r\n      {/* \u2500\u2500 ADD STAFF MODAL \u2500\u2500 */}';
  const correctOpenWin = '    </div>\r\n\r\n      {/* \u2500\u2500 ADD STAFF MODAL \u2500\u2500 */}';
  if (c.includes(prematureCloseWin)) {
    c = c.replace(prematureCloseWin, correctOpenWin);
    console.log('Fixed with Win endings!');
  } else {
    // Manual: find line indices
    const lines = c.split('\n');
    let funcEndLine = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '}' && i > 5) {
        // Check if line before is );
        if (lines[i-1] && lines[i-1].trim() === ');') {
          // Check if this is followed by the modal
          if (lines[i+2] && lines[i+2].includes('ADD STAFF MODAL')) {
            funcEndLine = i;
            console.log('Found premature close at line:', i);
            break;
          }
        }
      }
    }
    if (funcEndLine >= 0) {
      // Remove lines [funcEndLine-1, funcEndLine, funcEndLine+1] (the ); } empty line)
      lines.splice(funcEndLine - 1, 3);
      c = lines.join('\n');
      console.log('Removed premature close!');
    } else {
      console.log('Could not find premature close');
      // Print lines 305-315
      lines.forEach((l, i) => { if (i >= 304 && i <= 316) console.log(i+1, JSON.stringify(l)); });
    }
  }
}

fs.writeFileSync('src/app/[firmSlug]/(app)/staff/page.tsx', c);
console.log('Done');
