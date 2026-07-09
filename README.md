# sites

A collection of websites pulled/archived under [vecnode](https://github.com/vecnode), served via GitHub Pages.

## Layout

```
sites/
├── landing/        landing page (index) linking out to each site below
├── <site-name>/    one folder per pulled/archived site
scripts/
└── pull.sh         helper(s) to fetch/sync a site into sites/<name>/
```

## Adding a site

1. `mkdir sites/<name>` and drop the static content in.
2. Add a link + short description to `sites/landing/index.html`.
3. Commit and push — Pages redeploys automatically.

## Live

https://vecnode.github.io/sites/
