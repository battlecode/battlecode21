# Specs

Game specs are in `specs.md`, which is the source of truth.

We're using `pandoc` to generate a pretty HTML version of the specs:

```
pandoc specs.md --self-contained --template template.html --toc -o specs.html --metadata pagetitle="Battlecode 2020 Specs"
```

You can install `pandoc` using your favorite package manager.
