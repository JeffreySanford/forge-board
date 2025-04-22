/**
 * ESLint plugin: require-socket-cleanup
 * Warns if a class with a socket property does not call disconnect/unsubscribe in ngOnDestroy.
 */
module.exports = {
  rules: {
    'ngondestroy-socket-disconnect': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Ensure sockets are disconnected/unsubscribed in ngOnDestroy',
        },
        schema: [],
      },
      create: function(context) {
        return {
          ClassDeclaration(node) {
            // Only check Angular components/services
            const className = node.id && node.id.name;
            if (!className) return;

            // Find socket properties (e.g., this.socket, this.subscription)
            const socketProps = [];
            for (const bodyEl of node.body.body) {
              // Support both ESTree (PropertyDefinition) and legacy (ClassProperty)
              const isProp =
                (bodyEl.type === 'PropertyDefinition' || bodyEl.type === 'ClassProperty') &&
                bodyEl.key &&
                typeof bodyEl.key.name === 'string' &&
                /socket|subscription/i.test(bodyEl.key.name);
              if (isProp) {
                socketProps.push(bodyEl.key.name);
              }
            }
            if (socketProps.length === 0) return;

            // Find ngOnDestroy method
            const ngOnDestroy = node.body.body.find(
              (el) =>
                el.type === 'MethodDefinition' &&
                el.key &&
                el.key.name === 'ngOnDestroy'
            );
            if (!ngOnDestroy) {
              context.report({
                node,
                message:
                  `Class "${className}" has socket/subscription properties (${socketProps.join(
                    ', '
                  )}) but no ngOnDestroy for cleanup.`,
              });
              return;
            }

            // Check if ngOnDestroy calls disconnect/unsubscribe on socket/subscription
            const src = context.getSourceCode();
            const ngOnDestroyText = src.getText(ngOnDestroy.value.body);
            for (const prop of socketProps) {
              // Check for property-specific disconnect/unsubscribe calls
              const propRegex = new RegExp(`(this\\.)?${prop}\\.(disconnect|unsubscribe)\\(\\)`);
              if (!propRegex.test(ngOnDestroyText)) {
                context.report({
                  node: ngOnDestroy,
                  message: `ngOnDestroy should call disconnect/unsubscribe on "${prop}".`,
                });
              }
            }
          },
        };
      },
    },
  },
};
