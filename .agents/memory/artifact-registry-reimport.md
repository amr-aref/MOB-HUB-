---
name: Artifact registry can start empty on GitHub re-import
description: A repo imported from a "Published your App" git snapshot can have artifact.toml files on disk but an empty artifact/workflow registry.
---

## Symptom
- `artifacts/*/.replit-artifact/artifact.toml` exist and look correct (ports, previewPath, dev commands).
- `listArtifacts()` returns `[]` and `listWorkflows()` returns `[]` — the platform doesn't know these artifacts exist.
- `createArtifact()` refuses to help: it errors with `ARTIFACT_DIR_EXISTS` because the directory is already there, but there's no separate "re-register existing artifact" callback.

## Why
The git history was a single grafted "Published your App" deployment commit — i.e. only source files were exported, not the workspace-side artifact/workflow registry (which lives outside git). No tool currently rebuilds the registry from on-disk `artifact.toml` files.

## How to apply
Recover manually with `configureWorkflow`, one per service, replicating the `artifact.toml` service block: set `PORT` (and `BASE_PATH` if the app requires it) inline in the shell command since `configureWorkflow` has no env parameter, and use `waitForPort` matching that port. Note the real limitation this leaves: path-based multi-artifact proxy routing (serving several services under prefixes on one shared domain) is NOT restored this way — only whatever port/domain each workflow binds to directly is reachable (e.g. Expo's own `$REPLIT_EXPO_DEV_DOMAIN`, or curling a backend port directly). If true multi-artifact path routing is required, it likely needs platform-side support or removing+recreating the artifact directories via `createArtifact`.
