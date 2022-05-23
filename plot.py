import json
import matplotlib.pyplot as plt

with open('result.json', 'r') as f:
  data = json.load(f)

plt.rcParams.update({'font.size': 11})

print(data)
print(data["x"])
print(data["y"])

plt.bar(data["x"], data["y"])
plt.xlabel("Result (original value 50 + noise)", size=12, labelpad=10)
plt.ylabel("Relative frequency", size=12, labelpad=10)
plt.savefig("plot.pdf", bbox_inches="tight")
