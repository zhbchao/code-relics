# Code Relics

**An interactive museum of source code that changed how programmers think.**

The first exhibit opens Quake III Arena's famous fast inverse square root and
turns its IEEE-754 bit manipulation and Newton–Raphson correction into a live,
inspectable numerical lab.

## What is inside

- Museum-style, responsive landing page
- Interactive `0x5f3759df` exhibit
- IEEE-754 sign, exponent, and mantissa inspector
- Live comparison of the initial approximation and Newton-refined result
- Error visualization across twelve orders of magnitude
- Keyboard-friendly controls and reduced-motion support
- Numerical regression tests
- GitHub Actions deployment to GitHub Pages

## Local development

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

Run validation:

```bash
npm test
npm run build
```

## Deployment

Every push to `main` runs the numerical test suite, builds the Vite site, and
deploys `dist/` with GitHub's official Pages actions.

The Vite base path is set to `/code-relics/` for project Pages.

## Provenance

The educational source excerpt in Artifact 001 links to id Software's original
[Quake III Arena GPL source release](https://github.com/id-Software/Quake-III-Arena).
The Code Relics site code is licensed under MIT; third-party excerpts remain
under their original licenses.

## License

[MIT](LICENSE)
