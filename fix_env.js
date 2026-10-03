const fs=require('fs'); 
let e = fs.readFileSync('.env', 'utf8'); 
e=e.replace(/DATABASE_URL=.*/g, 'DATABASE_URL="postgresql://elscore:secret@localhost:5432/archos_db?schema=public"'); 
fs.writeFileSync('.env', e);
