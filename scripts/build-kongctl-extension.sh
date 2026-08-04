#!/usr/bin/env sh
set -e

VERSION="$1"
if [ -z "$VERSION" ]; then
  echo "Usage: $0 <version>" >&2
  exit 1
fi

SRC_DIR="extensions/kongctl"
OUT_DIR="dist"
PKG_DIR=$(mktemp -d)

# Stamp a real `version:` into the packaged manifest so `kongctl get extension`
# shows it without relying on the GitHub release-tag fallback. Not set in the
# committed manifest (would go stale) - only added here, at release-build time.
# Uses awk (not sed's `a` command) for the insert, since GNU and BSD/macOS sed
# disagree on `a` syntax while this awk pattern behaves identically on both.
awk -v line="version: ${VERSION}" '/^name: /{print; print line; next}1' \
  "$SRC_DIR/kongctl-extension.yaml" > "$PKG_DIR/kongctl-extension.yaml"
cp "$SRC_DIR/README.md" "$PKG_DIR/"
mkdir -p "$PKG_DIR/bin"
sed "s/__SPEC_RENDERER_VERSION__/${VERSION}/" "$SRC_DIR/bin/kongctl-ext" > "$PKG_DIR/bin/kongctl-ext"
chmod +x "$PKG_DIR/bin/kongctl-ext"

mkdir -p "$OUT_DIR"
tar -C "$PKG_DIR" -czf "$OUT_DIR/kongctl-ext-spec-preview-universal.tar.gz" \
  kongctl-extension.yaml README.md bin/kongctl-ext

rm -rf "$PKG_DIR"

echo "Built ${OUT_DIR}/kongctl-ext-spec-preview-universal.tar.gz for version ${VERSION}"
