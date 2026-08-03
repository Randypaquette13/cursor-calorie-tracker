# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Agent workflow

When the user asks for a change:

1. Implement on a `cursor/<descriptive-name>-8262` branch
2. **Commit and push** to GitHub — even for small changes
3. **Open a PR** to `main`
4. **Merge the PR to `main`** before saying the work is done

Creating a PR is not enough. Merged to `main` is the definition of done.

If merge conflicts appear, rebase onto `main`, resolve, push, and merge.

Deploy to Railway when the change affects what they run in Expo Go.
