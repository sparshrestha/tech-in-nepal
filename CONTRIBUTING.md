# Contributing to Tech in Nepal

Thank you for helping maintain this community directory. `README.md` is the source of truth for every listing, and the website is generated from it.

## Ways to contribute

### Edit on GitHub

1. Open [`README.md`](https://github.com/sparshrestha/tech-in-nepal/edit/main/README.md) in GitHub's editor.
2. Add, update or remove the entry in the appropriate category.
3. Keep the table of index and category headings unchanged unless your proposal adds a genuinely new category.
4. Describe why the change is needed and submit the pull request.

### Submit a request

If you are not comfortable editing the repository, [open a listing request](https://github.com/sparshrestha/tech-in-nepal/issues/new?template=listing.yml). A maintainer or contributor can turn an accepted request into a pull request.

## Listing format

Use one Markdown line per listing:

```markdown
- [Name](https://example.com/) - Short, factual and neutral description.
```

Descriptions should explain what the organization, product or resource does. Avoid slogans, unverifiable superlatives, keyword stuffing, calls to action and promotional pricing.

## Inclusion checklist

Before submitting, confirm that:

- The listing has a clear connection to Nepal's technology ecosystem.
- The URL is public, working and points to the primary source where possible.
- The same URL is not already listed.
- The description is concise, factual and written in neutral language.
- You disclose any employment, ownership or other material relationship to the listing.

## Keep changes reviewable

Prefer one logical change per pull request. Related updates may be grouped, but avoid mixing catalog changes with unrelated formatting or generated-site changes.

Do not edit `_site`; it is generated during the build.

## Validate locally

The project requires Node.js 22 or newer. No dependency installation is currently needed.

```sh
npm test
npm run validate
npm run build
```

CI runs the same catalog checks. A maintainer may edit a description for neutrality or ask for evidence of relevance before merging.

## Corrections and removals

Use the same pull-request or listing-request process for a correction, rebrand, broken URL or removal. Include a short explanation and a reliable source when the reason is not visible from the linked page.
