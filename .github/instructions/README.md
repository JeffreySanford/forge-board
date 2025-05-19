# 🛠️ ForgeBoard Instructions Index

This folder contains detailed contribution and coding standards for each major stack:

- [ANGULAR.md](./ANGULAR.md): Angular 19+ (no standalone, RxJS/NGRX, Material 3)
- [NESTJS.md](./NESTJS.md): NestJS backend
- [GO.md](./GO.md): Go microservices
- [CODING-STANDARDS.md](./CODING-STANDARDS.md): General coding standards

## 📖 How to Use

- All contributors must read the relevant file(s) before submitting code.
- For automated enforcement, add a pre-commit or CI check to verify that these files exist and are referenced in PR templates or documentation.

### Example Prompt for CI/Pre-commit

```sh
# Check that all instruction files exist
for f in .github/instructions/ANGULAR.md .github/instructions/NESTJS.md .github/instructions/GO.md .github/instructions/CODING-STANDARDS.md; do
  [ -f "$f" ] || { echo "Missing $f"; exit 1; }
done
```

- Optionally, add a PR template checklist item: "I have read and followed the relevant instructions in `.github/instructions/`."

---

*ForgeBoard — Own your data. Guard your freedom. Build Legendary.* 🦅✨
