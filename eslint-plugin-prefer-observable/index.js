module.exports = {
  rules: {
    "prefer-observable": {
      meta: {
        type: "suggestion",
        docs: {
          description: "Prefer RxJS Observables over Promises for async operations",
          category: "Best Practices",
          recommended: true,
        },
        fixable: "code",
      },
      create(context) {
        return {
          // Check for Promise type annotations
          TSTypeReference(node) {
            if (node.typeName && node.typeName.name === "Promise") {
              context.report({
                node,
                message: "Prefer Observable<T> over Promise<T> for better stream handling",
                fix(fixer) {
                  return fixer.replaceText(node.typeName, "Observable");
                }
              });
            }
          },
          
          // Check for async function declarations
          FunctionDeclaration(node) {
            if (node.async) {
              context.report({
                node,
                message: "Prefer Observable streams with operators over async/await pattern",
              });
            }
          },
          
          // Check for async method definitions
          MethodDefinition(node) {
            if (node.value && node.value.async) {
              // Exclude NestJS lifecycle hooks
              const nestjsLifecycleHooks = ['onModuleInit', 'onApplicationBootstrap', 'onModuleDestroy'];
              if (!nestjsLifecycleHooks.includes(node.key.name)) {
                context.report({
                  node,
                  message: "Prefer Observable streams with operators over async/await pattern",
                });
              }
            }
          },
          
          // Check for Promise.then usage
          CallExpression(node) {
            if (
              node.callee.property && 
              node.callee.property.name === "then" &&
              !context.getAncestors().some(ancestor => 
                ancestor.type === "CallExpression" && 
                ancestor.callee.property && 
                ancestor.callee.property.name === "pipe"
              )
            ) {
              context.report({
                node,
                message: "Prefer Observable pipe() with operators over Promise.then()",
              });
            }
          }
        };
      }
    }
  }
};
