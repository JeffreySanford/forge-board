/**
 * Custom ESLint rules for ForgeBoard
 */
module.exports = {
  rules: {
    'ngondestroy-socket-disconnect': {
      meta: {
        type: "problem",
        docs: {
          description: "Ensure sockets are properly disconnected in ngOnDestroy",
          category: "Possible Errors",
          recommended: true
        },
        fixable: null,
        schema: [] // no options
      },
      create: function(context) {
        return {
          ClassDeclaration: function(node) {
            // Only check classes with socket property
            var hasSocket = node.body.body.some(function(member) {
              return member.type === "PropertyDefinition" &&
                member.key.type === "Identifier" &&
                member.key.name === "socket";
            });

            if (!hasSocket) return;

            // Find the ngOnDestroy method
            var ngOnDestroyMethod = node.body.body.find(function(member) {
              return member.type === "MethodDefinition" &&
                member.key.type === "Identifier" &&
                member.key.name === "ngOnDestroy";
            });

            if (!ngOnDestroyMethod) {
              context.report({
                node: node,
                message: "Classes with socket property must implement ngOnDestroy method"
              });
              return;
            }

            // Check if ngOnDestroy method has socket cleanup code
            var methodBody = ngOnDestroyMethod.value.body.body;
            var hasSocketCleanup = methodBody.some(function(statement) {
              // Look for socket.off() or socket.disconnect() or cleanupSocket()
              return (
                // Check for this.socket.off()
                (statement.type === "ExpressionStatement" &&
                statement.expression.type === "CallExpression" &&
                statement.expression.callee.type === "MemberExpression" &&
                statement.expression.callee.object.type === "MemberExpression" &&
                statement.expression.callee.object.object.type === "ThisExpression" &&
                statement.expression.callee.object.property.name === "socket" &&
                statement.expression.callee.property.name === "off") ||
                
                // Check for this.socket.disconnect()
                (statement.type === "ExpressionStatement" &&
                statement.expression.type === "CallExpression" &&
                statement.expression.callee.type === "MemberExpression" &&
                statement.expression.callee.object.type === "MemberExpression" &&
                statement.expression.callee.object.object.type === "ThisExpression" &&
                statement.expression.callee.object.property.name === "socket" &&
                statement.expression.callee.property.name === "disconnect") ||
                
                // Check for this.cleanupSocket()
                (statement.type === "ExpressionStatement" &&
                statement.expression.type === "CallExpression" &&
                statement.expression.callee.type === "MemberExpression" &&
                statement.expression.callee.object.type === "ThisExpression" &&
                statement.expression.callee.property.name === "cleanupSocket")
              );
            });

            if (!hasSocketCleanup) {
              context.report({
                node: ngOnDestroyMethod,
                message: "ngOnDestroy method must clean up socket connections (call socket.off(), socket.disconnect(), or cleanupSocket())"
              });
            }
          }
        };
      }
    },
    
    // Non-standalone components rule
    'require-non-standalone-components': {
      meta: {
        type: "problem",
        docs: {
          description: "Enforce non-standalone components by requiring standalone: false",
          category: "Best Practices",
          recommended: true
        },
        fixable: "code",
        schema: [] // no options
      },
      create: function(context) {
        return {
          // Find decorator expressions that look like @Component(...)
          "Decorator[expression.callee.name='Component']": function(node) {
            const decoratorArgument = node.expression.arguments[0];
            
            // Only check object literals
            if (decoratorArgument && decoratorArgument.type === "ObjectExpression") {
              const standaloneProperty = decoratorArgument.properties.find(
                property => property.key && 
                  property.key.type === "Identifier" && 
                  property.key.name === "standalone"
              );
              
              // If standalone property exists but is not explicitly false
              if (standaloneProperty && standaloneProperty.value && 
                  (standaloneProperty.value.type !== "Literal" || 
                   standaloneProperty.value.value !== false)) {
                context.report({
                  node: standaloneProperty,
                  message: "Component must have standalone: false explicitly set",
                  fix: function(fixer) {
                    return fixer.replaceText(standaloneProperty.value, "false");
                  }
                });
              }
            }
          }
        };
      }
    }
  }
};
