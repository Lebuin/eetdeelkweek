collect images:

```
for f in *; do lower=${f,,}; convert $f "/path/to/images/${lower%.*}.jpg"; done
```
