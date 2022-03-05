import json
import matplotlib.pyplot as plt

with open('result.json', 'r') as f:
  data = json.load(f)

print(data)
print(data["x"])
print(data["y"])

plt.bar(data["x"], data["y"])
plt.show()