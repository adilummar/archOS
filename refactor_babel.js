const fs = require('fs');
const babel = require('@babel/core');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

const files = [
  'attendance.service.ts',
  'log.service.ts',
  'project.service.ts',
  'staff.service.ts',
  'user.service.ts'
];

files.forEach(filename => {
  const code = fs.readFileSync('src/services/' + filename, 'utf-8');
  
  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['typescript']
  });
  
  let hasPrisma = false;
  let hasWithAuthTx = false;

  traverse(ast, {
    ImportDeclaration(path) {
      if (path.node.source.value === '@/lib/db') {
        hasPrisma = true;
      }
      if (path.node.source.value === '@/lib/db-tx') {
        hasWithAuthTx = true;
      }
    },
    FunctionDeclaration(path) {
      if (!path.parentPath.isExportNamedDeclaration()) return;
      if (!path.node.async) return;
      
      const firstArg = path.node.params[0];
      if (!firstArg || firstArg.name !== 'ctx') return;
      
      const originalBody = path.node.body;
      
      path.traverse({
        Identifier(idPath) {
          if (idPath.node.name === 'prisma') {
            idPath.node.name = 'tx';
          }
        }
      });
      
      const txParam = t.identifier('tx');
      const arrowFunc = t.arrowFunctionExpression([txParam], originalBody);
      arrowFunc.async = true;
      
      const withAuthTxCall = t.callExpression(t.identifier('withAuthTx'), [t.identifier('ctx'), arrowFunc]);
      const returnStatement = t.returnStatement(withAuthTxCall);
      
      path.node.body = t.blockStatement([returnStatement]);
    }
  });

  if (hasPrisma && !hasWithAuthTx) {
    const importDecl = t.importDeclaration(
      [t.importSpecifier(t.identifier('withAuthTx'), t.identifier('withAuthTx'))],
      t.stringLiteral('@/lib/db-tx')
    );
    ast.program.body.unshift(importDecl);
  }
  
  const output = generate(ast, {}, code);
  fs.writeFileSync('src/services/' + filename, output.code);
  console.log('Refactored ' + filename);
});
