/**
 * ESLint rule to enforce proper socket cleanup in Angular services
 * 
 * @type {import('eslint').Rule.RuleModule}
 */
module.exports = {
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
      ClassDeclaration(node) {
        // Only check classes with socket property
        const hasSocket = node.body.body.some(member => 
          member.type === "PropertyDefinition" &&
          member.key.type === "Identifier" &&
          member.key.name === "socket"
        );

        if (!hasSocket) return;

        // Find the ngOnDestroy method
        const ngOnDestroyMethod = node.body.body.find(member => 
          member.type === "MethodDefinition" &&
          member.key.type === "Identifier" &&
          member.key.name === "ngOnDestroy"
        );

        if (!ngOnDestroyMethod) {
          context.report({
            node,
            message: "Classes with socket property must implement ngOnDestroy method"
          });
          return;
        }

        // Check if ngOnDestroy method has socket cleanup code
        const methodBody = ngOnDestroyMethod.value.body.body;
        const hasSocketCleanup = methodBody.some(statement => {
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
};
