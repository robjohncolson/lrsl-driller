# Topic 5.8 Extension Spec — Sampling Distributions for Differences in Sample Means

## Overview

Extend the `apstats-u5-sampling-dist` cartridge with **6 new modes** (l36–l41) covering AP Statistics Topic 5.8: Sampling Distributions for Differences in Sample Means. This mirrors the structure of Topic 5.6 (differences in proportions) but for quantitative data.

**AP Learning Objectives**: UNC-3.T (parameters), UNC-3.U (normality shape), UNC-3.V (interpret parameters & probabilities)

**Core formulas**:
- μ_{x̄₁−x̄₂} = μ₁ − μ₂
- σ_{x̄₁−x̄₂} = √(σ₁²/n₁ + σ₂²/n₂)
- Conditions: 10% condition for BOTH samples; samples independent
- Shape: approximately normal when BOTH populations are normal, OR BOTH n₁ ≥ 30 AND n₂ ≥ 30

---

## Files to Modify

### 1. `cartridges/apstats-u5-sampling-dist/manifest.json`

#### a. Update `meta`
- Change `"name"` from `"Sampling Distributions (5.1-5.7)"` to `"Sampling Distributions (5.1-5.8)"`
- Append to `"description"`: `", sampling distributions for differences in sample means"`

#### b. Add skills
Add to `config.skills` array:
```json
"UNC-3.T",
"UNC-3.U",
"UNC-3.V"
```

#### c. Add 6 new modes (append after `l35-capstone-57`)

**Mode l36: x̄₁−x̄₂ Distribution Parameters (5.8a)**
```json
{
  "id": "l36-diff-mean-params",
  "name": "5.8a: x̄₁−x̄₂ Parameters",
  "animation": "assets/DiffMeanFormulas.mp4",
  "unlockedBy": { "gold": 1 },
  "layout": {
    "inputs": [
      {
        "id": "diffMeanMu",
        "type": "number",
        "label": "Mean of the sampling distribution of x̄₁ − x̄₂ (μ_{x̄₁−x̄₂}):",
        "step": 0.01
      },
      {
        "id": "diffMeanSD",
        "type": "number",
        "label": "Standard deviation of x̄₁ − x̄₂ (σ_{x̄₁−x̄₂}):",
        "min": 0,
        "step": 0.001
      }
    ]
  }
}
```

**Mode l37: Shape of x̄₁−x̄₂ Distribution (5.8b)**
```json
{
  "id": "l37-diff-mean-shape",
  "name": "5.8b: Shape of x̄₁−x̄₂",
  "animation": "assets/DiffMeanShape.mp4",
  "unlockedBy": { "gold": 1 },
  "layout": {
    "inputs": [
      {
        "id": "diffMeanShapeChoice",
        "type": "choice",
        "label": "Is the sampling distribution of x̄₁ − x̄₂ approximately normal?",
        "options": [
          "Yes, approximately normal",
          "No, NOT approximately normal"
        ]
      },
      {
        "id": "diffMeanShapeExplain",
        "type": "textarea",
        "label": "Explain your reasoning:",
        "rows": 3,
        "placeholder": "Reference both population shapes, both sample sizes, and CLT conditions..."
      }
    ]
  }
}
```

**Mode l38: Interpret x̄₁−x̄₂ Parameters (5.8c)**
```json
{
  "id": "l38-diff-mean-interpret",
  "name": "5.8c: Interpret x̄₁−x̄₂",
  "animation": "assets/DiffMeanInterpret.mp4",
  "unlockedBy": { "gold": 1 },
  "layout": {
    "inputs": [
      {
        "id": "diffMeanInterpretAnswer",
        "type": "dropdown",
        "label": "Which interpretation is correct?",
        "options": [
          "{{optA}}",
          "{{optB}}",
          "{{optC}}",
          "{{optD}}"
        ],
        "placeholder": "Choose..."
      }
    ]
  }
}
```

**Mode l39: x̄₁−x̄₂ Probability (5.8d)**
```json
{
  "id": "l39-diff-mean-probability",
  "name": "5.8d: x̄₁−x̄₂ Probability",
  "animation": "assets/DiffMeanProbability.mp4",
  "unlockedBy": { "gold": 1 },
  "layout": {
    "inputs": [
      {
        "id": "diffMeanZScore",
        "type": "number",
        "label": "Z-score:",
        "step": 0.01
      },
      {
        "id": "diffMeanProb",
        "type": "number",
        "label": "Probability (as decimal, e.g., 0.2206):",
        "min": 0,
        "max": 1,
        "step": 0.0001
      }
    ]
  }
}
```

**Mode l40: Interpret x̄₁−x̄₂ Probability (5.8e)**
```json
{
  "id": "l40-diff-mean-interpret-prob",
  "name": "5.8e: Interpret Probability",
  "animation": "assets/DiffMeanInterpretProb.mp4",
  "unlockedBy": { "gold": 1 },
  "layout": {
    "inputs": [
      {
        "id": "diffMeanInterpretProbText",
        "type": "textarea",
        "label": "Interpret this probability in context (reference 'all possible samples'):",
        "rows": 4,
        "placeholder": "Getting a difference in sample means of ... or [more/less] happens in about ...% of all possible samples of size ... from ... and size ... from ..."
      },
      {
        "id": "diffMeanUnusualChoice",
        "type": "dropdown",
        "label": "Is this result unusual?",
        "options": [
          "Unusual — probability is less than 5%",
          "Not unusual — probability is 5% or more"
        ],
        "placeholder": "Choose..."
      }
    ]
  }
}
```

**Mode l41: 5.8 Capstone**
```json
{
  "id": "l41-capstone-58",
  "name": "5.8 Capstone",
  "animation": "assets/DiffMeanCapstone.mp4",
  "unlockedBy": { "gold": 3 },
  "layout": {
    "inputs": [
      {
        "id": "capstone58Answer",
        "type": "dropdown",
        "label": "Select the correct answer:",
        "options": [
          "{{optA}}",
          "{{optB}}",
          "{{optC}}",
          "{{optD}}"
        ],
        "placeholder": "Choose..."
      },
      {
        "id": "capstone58Explain",
        "type": "textarea",
        "label": "Explain your reasoning:",
        "rows": 3,
        "placeholder": "Show your work and explain..."
      }
    ]
  }
}
```

#### d. Add hints (append to `hints.perField`)

```json
"diffMeanMu": "The mean of the sampling distribution of x̄₁ − x̄₂ equals the difference in population means: μ_{x̄₁−x̄₂} = μ₁ − μ₂.",
"diffMeanSD": "The standard deviation is σ_{x̄₁−x̄₂} = √(σ₁²/n₁ + σ₂²/n₂). ⚠️ VARIANCE TRAP: Add the VARIANCES (σ₁²/n₁ + σ₂²/n₂), then take the square root. Don't forget to check the 10% condition for BOTH samples.",
"diffMeanShapeChoice": "Two paths to normality for x̄₁ − x̄₂: (1) BOTH populations are normal → any sample sizes work, or (2) BOTH sample sizes ≥ 30 (CLT). You need BOTH populations to satisfy the same condition.",
"diffMeanShapeExplain": "Reference both population shapes and both sample sizes. If BOTH populations are normal → any n₁, n₂. If either is non-normal → need BOTH n₁ ≥ 30 AND n₂ ≥ 30.",
"diffMeanInterpretAnswer": "When interpreting μ_{x̄₁−x̄₂}: reference 'all possible samples of size n₁ from [pop 1] and size n₂ from [pop 2],' include units, specify subtraction order. When interpreting σ_{x̄₁−x̄₂}: use 'typically' to describe variation.",
"diffMeanZScore": "z = (observed difference − μ_{x̄₁−x̄₂}) / σ_{x̄₁−x̄₂}. Use μ₁ − μ₂ for the mean and √(σ₁²/n₁ + σ₂²/n₂) for the SD.",
"diffMeanProb": "After finding the z-score, use Table A or normalcdf. For P(x̄₁−x̄₂ > value): find 1 − P(Z < z). For P(x̄₁−x̄₂ < value): use P(Z < z) directly.",
"diffMeanInterpretProbText": "A good interpretation must: (1) reference 'all possible samples of size n₁ from [pop 1] and size n₂ from [pop 2]', (2) include the probability or percentage, (3) describe the observed difference and direction, (4) use context with units. Template: 'Getting a difference of ___ or [more/less] happens in about ___% of all possible samples of size ___ from ___ and size ___ from ___.'",
"diffMeanUnusualChoice": "Convention: if the probability is less than 5% (0.05), the result IS unusual. If the probability is 5% or more, it is NOT unusual.",
"capstone58Answer": "This question combines concepts from Topic 5.8. Review: μ_{x̄₁−x̄₂} = μ₁ − μ₂, σ_{x̄₁−x̄₂} = √(σ₁²/n₁ + σ₂²/n₂), 10% condition for both, shape conditions (both normal OR both n ≥ 30), and probability calculations.",
"capstone58Explain": "Show your work: identify the concept, write the formula, plug in values, and explain your reasoning in context. Reference the specific condition or formula that applies."
```

#### e. Add progression tiers (append to `progression.tiers`)

```json
{
  "id": "l36-diff-mean-params",
  "name": "5.8a",
  "unlockedBy": { "gold": 1 },
  "celebrationMessage": "x̄₁−x̄₂ parameters mastered! Next: determining the shape of the distribution."
},
{
  "id": "l37-diff-mean-shape",
  "name": "5.8b",
  "unlockedBy": { "gold": 1 },
  "celebrationMessage": "You know when x̄₁−x̄₂ is approximately normal! Next: interpreting parameters in context."
},
{
  "id": "l38-diff-mean-interpret",
  "name": "5.8c",
  "unlockedBy": { "gold": 1 },
  "celebrationMessage": "Interpretation mastered! Next: calculating probabilities with x̄₁−x̄₂."
},
{
  "id": "l39-diff-mean-probability",
  "name": "5.8d",
  "unlockedBy": { "gold": 1 },
  "celebrationMessage": "x̄₁−x̄₂ probability calculations mastered! Next: interpret what those probabilities mean."
},
{
  "id": "l40-diff-mean-interpret-prob",
  "name": "5.8e",
  "unlockedBy": { "gold": 1 },
  "celebrationMessage": "You can interpret x̄₁−x̄₂ probabilities in context! Final 5.8 capstone next."
},
{
  "id": "l41-capstone-58",
  "name": "5.8 Cap",
  "unlockedBy": { "gold": 3 },
  "celebrationMessage": "TOPIC 5.8 COMPLETE! You've mastered sampling distributions for differences in sample means! Unit 5 complete!"
}
```

Also update the l35 capstone celebration message from `"Unit 5 complete!"` to:
```
"TOPIC 5.7 COMPLETE! You've mastered sampling distributions for sample means! Next: differences in sample means."
```

---

### 2. `cartridges/apstats-u5-sampling-dist/generator.js`

#### a. Add the `diffMeanContextBank` array (two-population scenarios)

Place this after the `capstone57Bank` array (around line 2150). Each scenario has TWO independent populations with distinct labels, contexts, μ, σ, n, N, and units.

```js
// ---- L36/L39/L40: Two-population contexts for x̄₁ − x̄₂ ----
const diffMeanContextBank = [
  {
    context: "A tree produces lemons and a different tree produces oranges",
    label1: "lemons", label2: "oranges",
    pop1Desc: "Lemon weights are approximately normally distributed",
    pop2Desc: "Orange weights are approximately normally distributed",
    mu1: 4, sigma1: 0.5, n1: 6, N1: 5000,
    mu2: 3, sigma2: 0.4, n2: 6, N2: 5000,
    unit: "oz", measurable: "weight",
    pop1Normal: true, pop2Normal: true
  },
  {
    context: "A factory produces bolts on two different machines",
    label1: "Machine A bolts", label2: "Machine B bolts",
    pop1Desc: "Machine A bolt diameters are approximately normally distributed",
    pop2Desc: "Machine B bolt diameters are approximately normally distributed",
    mu1: 10, sigma1: 0.2, n1: 25, N1: 50000,
    mu2: 9.8, sigma2: 0.15, n2: 30, N2: 50000,
    unit: "mm", measurable: "diameter",
    pop1Normal: true, pop2Normal: true
  },
  {
    context: "Two competing coffee shops serve different cup sizes",
    label1: "Shop A cups", label2: "Shop B cups",
    pop1Desc: "Shop A fill amounts are approximately normally distributed",
    pop2Desc: "Shop B fill amounts are approximately normally distributed",
    mu1: 12.1, sigma1: 0.3, n1: 15, N1: 80000,
    mu2: 11.8, sigma2: 0.25, n2: 20, N2: 60000,
    unit: "oz", measurable: "fill amount",
    pop1Normal: true, pop2Normal: true
  },
  {
    context: "A hospital compares birth weights at two locations",
    label1: "Hospital A newborns", label2: "Hospital B newborns",
    pop1Desc: "Hospital A birth weights are approximately normally distributed",
    pop2Desc: "Hospital B birth weights are approximately normally distributed",
    mu1: 7.5, sigma1: 1.1, n1: 20, N1: 15000,
    mu2: 7.2, sigma2: 0.9, n2: 25, N2: 12000,
    unit: "lb", measurable: "birth weight",
    pop1Normal: true, pop2Normal: true
  },
  {
    context: "Two battery brands are compared for lifetime",
    label1: "Brand X batteries", label2: "Brand Y batteries",
    pop1Desc: "Brand X lifetimes are approximately normally distributed",
    pop2Desc: "Brand Y lifetimes are approximately normally distributed",
    mu1: 500, sigma1: 40, n1: 35, N1: 200000,
    mu2: 480, sigma2: 35, n2: 40, N2: 150000,
    unit: "hours", measurable: "lifetime",
    pop1Normal: true, pop2Normal: true
  },
  {
    context: "Test scores are compared between two large high schools",
    label1: "School A students", label2: "School B students",
    pop1Desc: "School A test scores are approximately normally distributed",
    pop2Desc: "School B test scores are approximately normally distributed",
    mu1: 74, sigma1: 11, n1: 36, N1: 2000,
    mu2: 70, sigma2: 13, n2: 40, N2: 2500,
    unit: "points", measurable: "test score",
    pop1Normal: true, pop2Normal: true
  },
  {
    context: "A researcher compares commute times in two cities",
    label1: "City A commuters", label2: "City B commuters",
    pop1Desc: "City A commute times are approximately normally distributed",
    pop2Desc: "City B commute times are approximately normally distributed",
    mu1: 35, sigma1: 8, n1: 50, N1: 300000,
    mu2: 28, sigma2: 6, n2: 45, N2: 250000,
    unit: "min", measurable: "commute time",
    pop1Normal: true, pop2Normal: true
  },
  {
    context: "Two farms grow apples of different varieties",
    label1: "Honeycrisp apples", label2: "Fuji apples",
    pop1Desc: "Honeycrisp apple weights are approximately normally distributed",
    pop2Desc: "Fuji apple weights are approximately normally distributed",
    mu1: 8, sigma1: 0.6, n1: 10, N1: 25000,
    mu2: 7.2, sigma2: 0.5, n2: 12, N2: 30000,
    unit: "oz", measurable: "weight",
    pop1Normal: true, pop2Normal: true
  },
  {
    context: "A manufacturer compares fill volumes from two bottling lines",
    label1: "Line 1 bottles", label2: "Line 2 bottles",
    pop1Desc: "Line 1 fill volumes are approximately normally distributed",
    pop2Desc: "Line 2 fill volumes are approximately normally distributed",
    mu1: 502, sigma1: 4, n1: 15, N1: 100000,
    mu2: 498, sigma2: 5, n2: 18, N2: 100000,
    unit: "mL", measurable: "fill volume",
    pop1Normal: true, pop2Normal: true
  },
  {
    context: "Reaction times are compared for two age groups of drivers",
    label1: "younger drivers (20-30)", label2: "older drivers (60-70)",
    pop1Desc: "Younger driver reaction times are approximately normally distributed",
    pop2Desc: "Older driver reaction times are approximately normally distributed",
    mu1: 1.5, sigma1: 0.3, n1: 40, N1: 500000,
    mu2: 2.1, sigma2: 0.5, n2: 35, N2: 400000,
    unit: "sec", measurable: "reaction time",
    pop1Normal: true, pop2Normal: true
  }
];
```

#### b. Add the `diffMeanShapeBank` array

This bank contains scenarios where students must decide if x̄₁ − x̄₂ is approximately normal. **Key rule**: BOTH populations must be normal, OR BOTH n₁ ≥ 30 AND n₂ ≥ 30.

```js
// ---- L37: Shape of x̄₁ − x̄₂ distribution (5.8b) ----
const diffMeanShapeBank = [
  {
    pop1Desc: "Population 1 is approximately normally distributed",
    pop2Desc: "Population 2 is approximately normally distributed",
    n1: 8, n2: 10,
    isNormal: true,
    reason: "Both populations are approximately normal, so the sampling distribution of x̄₁ − x̄₂ is approximately normal for ANY sample sizes, including n₁ = 8 and n₂ = 10.",
    givenInfo: "Pop 1: normal | Pop 2: normal | n₁ = 8, n₂ = 10"
  },
  {
    pop1Desc: "Population 1 is strongly right-skewed",
    pop2Desc: "Population 2 is approximately normally distributed",
    n1: 15, n2: 20,
    isNormal: false,
    reason: "Population 1 is strongly right-skewed and n₁ = 15 < 30. Even though Population 2 is normal, BOTH populations must be normal (or BOTH n ≥ 30) for x̄₁ − x̄₂ to be approximately normal.",
    givenInfo: "Pop 1: strongly right-skewed | Pop 2: normal | n₁ = 15, n₂ = 20"
  },
  {
    pop1Desc: "Population 1 is right-skewed",
    pop2Desc: "Population 2 is left-skewed",
    n1: 50, n2: 45,
    isNormal: true,
    reason: "Neither population is normal, but BOTH sample sizes are ≥ 30 (n₁ = 50 and n₂ = 45). By the CLT, the sampling distribution of x̄₁ − x̄₂ is approximately normal.",
    givenInfo: "Pop 1: right-skewed | Pop 2: left-skewed | n₁ = 50, n₂ = 45"
  },
  {
    pop1Desc: "Population 1 is uniform",
    pop2Desc: "Population 2 is bimodal",
    n1: 35, n2: 20,
    isNormal: false,
    reason: "Neither population is normal. Although n₁ = 35 ≥ 30, n₂ = 20 < 30. BOTH sample sizes must be ≥ 30 for the CLT to apply to x̄₁ − x̄₂. Since n₂ is too small, the distribution is NOT approximately normal.",
    givenInfo: "Pop 1: uniform | Pop 2: bimodal | n₁ = 35, n₂ = 20"
  },
  {
    pop1Desc: "Population 1 is approximately normally distributed",
    pop2Desc: "Population 2 is approximately normally distributed",
    n1: 4, n2: 5,
    isNormal: true,
    reason: "Both populations are approximately normal. When BOTH populations are normal, the sampling distribution of x̄₁ − x̄₂ is normal for any sample sizes, even very small ones like n₁ = 4 and n₂ = 5.",
    givenInfo: "Pop 1: normal | Pop 2: normal | n₁ = 4, n₂ = 5"
  },
  {
    pop1Desc: "Population 1 is heavily right-skewed (exponential)",
    pop2Desc: "Population 2 is heavily right-skewed (exponential)",
    n1: 10, n2: 12,
    isNormal: false,
    reason: "Both populations are heavily right-skewed and both sample sizes are < 30 (n₁ = 10, n₂ = 12). The CLT requires BOTH n ≥ 30 for non-normal populations.",
    givenInfo: "Pop 1: exponential | Pop 2: exponential | n₁ = 10, n₂ = 12"
  },
  {
    pop1Desc: "Population 1 is heavily right-skewed (exponential)",
    pop2Desc: "Population 2 is heavily right-skewed (exponential)",
    n1: 40, n2: 35,
    isNormal: true,
    reason: "Both populations are non-normal, but BOTH n₁ = 40 ≥ 30 AND n₂ = 35 ≥ 30. The CLT applies to both, making x̄₁ − x̄₂ approximately normal.",
    givenInfo: "Pop 1: exponential | Pop 2: exponential | n₁ = 40, n₂ = 35"
  },
  {
    pop1Desc: "Population 1 is approximately normally distributed",
    pop2Desc: "Population 2 is strongly left-skewed",
    n1: 50, n2: 8,
    isNormal: false,
    reason: "Population 1 is normal but Population 2 is strongly left-skewed with n₂ = 8 < 30. For x̄₁ − x̄₂ to be approximately normal, BOTH populations must be normal OR BOTH n ≥ 30. Neither condition is fully met.",
    givenInfo: "Pop 1: normal | Pop 2: strongly left-skewed | n₁ = 50, n₂ = 8"
  },
  {
    pop1Desc: "Population 1 is slightly skewed",
    pop2Desc: "Population 2 is slightly skewed",
    n1: 30, n2: 30,
    isNormal: true,
    reason: "Both populations are slightly non-normal, but BOTH n₁ = 30 AND n₂ = 30 meet the CLT threshold. The sampling distribution of x̄₁ − x̄₂ is approximately normal.",
    givenInfo: "Pop 1: slightly skewed | Pop 2: slightly skewed | n₁ = 30, n₂ = 30"
  },
  {
    pop1Desc: "Population 1 is bimodal",
    pop2Desc: "Population 2 is uniform",
    n1: 25, n2: 40,
    isNormal: false,
    reason: "Population 1 is bimodal and n₁ = 25 < 30. Even though n₂ = 40 ≥ 30, BOTH sample sizes must be ≥ 30 for the CLT to guarantee approximate normality. Since n₁ < 30, the condition is not met.",
    givenInfo: "Pop 1: bimodal | Pop 2: uniform | n₁ = 25, n₂ = 40"
  }
];
```

#### c. Add the `diffMeanInterpretBank` array

Similar structure to `meanInterpretParamsBank` but for two populations. Half interpret μ_{x̄₁−x̄₂}, half interpret σ_{x̄₁−x̄₂}.

```js
// ---- L38: Interpret x̄₁ − x̄₂ parameters (5.8c) ----
const diffMeanInterpretBank = [
  {
    context: "Lemons (μ₁=4 oz, σ₁=0.5 oz) and oranges (μ₂=3 oz, σ₂=0.4 oz). Random samples of 6 lemons and 6 oranges are selected.",
    mu1: 4, sigma1: 0.5, n1: 6, mu2: 3, sigma2: 0.4, n2: 6, unit: "oz",
    label1: "lemons", label2: "oranges", paramType: "mean",
    correctInterpretation: "μ_{x̄₁−x̄₂} = 1 oz, meaning that across all possible samples of 6 lemons and 6 oranges, the average difference (L − O) in sample mean weights equals the true difference of 1 oz",
    wrongInterpretations: [
      "In every pair of samples, the difference in sample means will be exactly 1 oz",
      "The mean of 1 oz means each lemon weighs exactly 1 oz more than each orange",
      "μ_{x̄₁−x̄₂} = 1 oz means 100% of sample differences will be positive"
    ]
  },
  {
    context: "Lemons (μ₁=4 oz, σ₁=0.5 oz) and oranges (μ₂=3 oz, σ₂=0.4 oz). Random samples of 6 lemons and 6 oranges are selected.",
    mu1: 4, sigma1: 0.5, n1: 6, mu2: 3, sigma2: 0.4, n2: 6, unit: "oz",
    label1: "lemons", label2: "oranges", paramType: "sd",
    correctInterpretation: "σ_{x̄₁−x̄₂} ≈ 0.261 oz, meaning the difference in sample mean weights typically varies by about 0.261 oz from the true difference of 1 oz across all possible samples of 6 lemons and 6 oranges",
    wrongInterpretations: [
      "The standard deviation of 0.261 oz means every sample difference is within 0.261 oz of 1",
      "σ_{x̄₁−x̄₂} = 0.261 means each individual fruit weight varies by 0.261 oz",
      "The standard deviation means there is a 26.1% chance of error"
    ]
  },
  {
    context: "Bolts from Machine A (μ₁=10 mm, σ₁=0.2 mm) and Machine B (μ₂=9.8 mm, σ₂=0.15 mm). Samples of 25 from A and 30 from B.",
    mu1: 10, sigma1: 0.2, n1: 25, mu2: 9.8, sigma2: 0.15, n2: 30, unit: "mm",
    label1: "Machine A bolts", label2: "Machine B bolts", paramType: "mean",
    correctInterpretation: "μ_{x̄₁−x̄₂} = 0.2 mm, meaning across all possible samples of 25 bolts from Machine A and 30 from Machine B, the average difference (A − B) in sample mean diameters equals 0.2 mm",
    wrongInterpretations: [
      "Every pair of samples will show exactly 0.2 mm difference",
      "0.2 mm is the difference we observed in our specific pair of samples",
      "μ_{x̄₁−x̄₂} = 0.2 means Machine A is always 0.2 mm better than Machine B"
    ]
  },
  {
    context: "Brand X batteries (μ₁=500 hr, σ₁=40 hr) and Brand Y batteries (μ₂=480 hr, σ₂=35 hr). Samples of 35 from X and 40 from Y.",
    mu1: 500, sigma1: 40, n1: 35, mu2: 480, sigma2: 35, n2: 40, unit: "hours",
    label1: "Brand X", label2: "Brand Y", paramType: "sd",
    correctInterpretation: "σ_{x̄₁−x̄₂} ≈ 8.515 hours, meaning the difference (X − Y) in sample mean lifetimes typically varies by about 8.515 hours from the true difference of 20 hours across all possible samples of 35 Brand X and 40 Brand Y batteries",
    wrongInterpretations: [
      "The standard deviation guarantees x̄₁ − x̄₂ is always within 8.515 hours of 20",
      "σ_{x̄₁−x̄₂} = 8.515 means each individual battery's lifetime varies by 8.515 hours",
      "The standard deviation of 8.515 hours means there is an 85.15% confidence level"
    ]
  },
  {
    context: "School A students (μ₁=74 pts, σ₁=11 pts) and School B students (μ₂=70 pts, σ₂=13 pts). Samples of 36 from A and 40 from B.",
    mu1: 74, sigma1: 11, n1: 36, mu2: 70, sigma2: 13, n2: 40, unit: "points",
    label1: "School A", label2: "School B", paramType: "mean",
    correctInterpretation: "μ_{x̄₁−x̄₂} = 4 points, meaning that if we took all possible samples of 36 School A and 40 School B students, the average of all differences (A − B) in sample mean test scores would equal 4 points",
    wrongInterpretations: [
      "Our specific samples will always show a 4-point difference",
      "4 points is the result of our particular pair of samples, not a property of all possible samples",
      "μ_{x̄₁−x̄₂} = 4 means School A scores are always 4 points higher than School B"
    ]
  },
  {
    context: "City A commuters (μ₁=35 min, σ₁=8 min) and City B commuters (μ₂=28 min, σ₂=6 min). Samples of 50 from A and 45 from B.",
    mu1: 35, sigma1: 8, n1: 50, mu2: 28, sigma2: 6, n2: 45, unit: "min",
    label1: "City A", label2: "City B", paramType: "sd",
    correctInterpretation: "σ_{x̄₁−x̄₂} ≈ 1.381 min, meaning the difference (A − B) in sample mean commute times typically varies by about 1.381 min from the true difference of 7 min across all possible samples of 50 from City A and 45 from City B",
    wrongInterpretations: [
      "σ_{x̄₁−x̄₂} = 1.381 min means each commuter's time varies by 1.381 min from the mean",
      "The standard deviation guarantees x̄₁ − x̄₂ is always between 5.619 and 8.381 min",
      "σ_{x̄₁−x̄₂} = 1.381 means there is a 1.381% probability of error"
    ]
  },
  {
    context: "Honeycrisp apples (μ₁=8 oz, σ₁=0.6 oz) and Fuji apples (μ₂=7.2 oz, σ₂=0.5 oz). Samples of 10 Honeycrisp and 12 Fuji.",
    mu1: 8, sigma1: 0.6, n1: 10, mu2: 7.2, sigma2: 0.5, n2: 12, unit: "oz",
    label1: "Honeycrisp", label2: "Fuji", paramType: "mean",
    correctInterpretation: "μ_{x̄₁−x̄₂} = 0.8 oz, meaning across all possible samples of 10 Honeycrisp and 12 Fuji apples, the average difference in sample mean weights equals the true population difference of 0.8 oz",
    wrongInterpretations: [
      "Every Honeycrisp apple weighs exactly 0.8 oz more than every Fuji apple",
      "0.8 oz is the difference we will observe in our specific sample pair",
      "μ_{x̄₁−x̄₂} = 0.8 oz means the difference will be between 0 and 1.6 oz"
    ]
  },
  {
    context: "Hospital A newborns (μ₁=7.5 lb, σ₁=1.1 lb) and Hospital B newborns (μ₂=7.2 lb, σ₂=0.9 lb). Samples of 20 from A and 25 from B.",
    mu1: 7.5, sigma1: 1.1, n1: 20, mu2: 7.2, sigma2: 0.9, n2: 25, unit: "lb",
    label1: "Hospital A", label2: "Hospital B", paramType: "sd",
    correctInterpretation: "σ_{x̄₁−x̄₂} ≈ 0.300 lb, meaning the difference (A − B) in sample mean birth weights typically varies by about 0.300 lb from the true difference of 0.3 lb across all possible samples of 20 from Hospital A and 25 from Hospital B",
    wrongInterpretations: [
      "σ_{x̄₁−x̄₂} = 0.300 lb means each newborn's weight varies by 0.300 lb from the mean",
      "The standard deviation of 0.300 lb means the difference is guaranteed to be between 0 and 0.6 lb",
      "σ_{x̄₁−x̄₂} = 0.300 means a 30% chance of observing a negative difference"
    ]
  }
];
```

#### d. Add the `capstone58Bank` array

```js
// ---- L41: 5.8 Capstone scenarios ----
const capstone58Bank = [
  {
    scenarioText: "Lemons have μ₁ = 4 oz, σ₁ = 0.5 oz and oranges have μ₂ = 3 oz, σ₂ = 0.4 oz. Random samples of 6 from each tree are selected. What are the mean and standard deviation of the sampling distribution of x̄_L − x̄_O?",
    correctAnswer: "μ = 4 − 3 = 1 oz, σ = √(0.5²/6 + 0.4²/6) = √(0.0417 + 0.0267) ≈ 0.261 oz",
    wrongOptions: [
      "μ = 1 oz, σ = √(0.5² + 0.4²) = 0.640 oz (forgot to divide by n)",
      "μ = 1 oz, σ = 0.5/√6 + 0.4/√6 = 0.367 oz (added SDs/√n instead of using √(sum of variances))",
      "μ = 7 oz, σ = √(0.5²/6 + 0.4²/6) ≈ 0.261 oz (added means instead of subtracting)"
    ],
    explanation: "μ_{x̄₁−x̄₂} = μ₁ − μ₂ = 4 − 3 = 1 oz. σ_{x̄₁−x̄₂} = √(σ₁²/n₁ + σ₂²/n₂) = √(0.25/6 + 0.16/6) = √(0.0683) ≈ 0.261 oz. The 10% condition is met for both (6 < 500).",
    topicId: "5.8: Distribution Parameters"
  },
  {
    scenarioText: "Population 1 is right-skewed with n₁ = 35. Population 2 is approximately normal with n₂ = 12. Is the sampling distribution of x̄₁ − x̄₂ approximately normal?",
    correctAnswer: "No — Population 2 is normal but Population 1 is not, AND n₂ = 12 < 30 so the CLT doesn't cover both",
    wrongOptions: [
      "Yes — Population 2 is normal so the whole distribution is normal",
      "Yes — n₁ = 35 ≥ 30 is large enough for both populations",
      "Yes — the sum n₁ + n₂ = 47 ≥ 30 satisfies the CLT"
    ],
    explanation: "For x̄₁ − x̄₂ to be approximately normal: BOTH populations must be normal, OR BOTH n ≥ 30. Here Pop 1 is not normal (ruling out condition 1), and n₂ = 12 < 30 (ruling out condition 2). BOTH conditions fail.",
    topicId: "5.8: Shape Conditions"
  },
  {
    scenarioText: "Battery Brand X: μ₁ = 500 hr, σ₁ = 40 hr, n₁ = 35. Brand Y: μ₂ = 480 hr, σ₂ = 35 hr, n₂ = 40. What is P(x̄_X − x̄_Y > 30)?",
    correctAnswer: "z = (30 − 20)/8.515 ≈ 1.17, P = 1 − 0.8790 = 0.1210",
    wrongOptions: [
      "z = (30 − 20)/40 = 0.25, P = 0.4013 (used σ₁ instead of σ_{x̄₁−x̄₂})",
      "z = (30 − 20)/75 = 0.133, P = 0.4471 (added σ values instead of variances)",
      "z = (30 − 0)/8.515 ≈ 3.52, P ≈ 0.0002 (used 0 as the mean instead of μ₁ − μ₂)"
    ],
    explanation: "μ_{x̄₁−x̄₂} = 500 − 480 = 20. σ_{x̄₁−x̄₂} = √(40²/35 + 35²/40) = √(45.71 + 30.625) = √76.34 ≈ 8.515. z = (30 − 20)/8.515 ≈ 1.17. P(Z > 1.17) ≈ 0.1210.",
    topicId: "5.8: Probability Calculation"
  },
  {
    scenarioText: "The standard deviation of the sampling distribution of x̄₁ − x̄₂ is 0.26 oz for samples of 6 lemons and 6 oranges (true difference = 1 oz). Which interpretation is correct?",
    correctAnswer: "The difference in sample mean weights typically varies by about 0.26 oz from the true difference of 1 oz across all possible samples of 6 lemons and 6 oranges",
    wrongOptions: [
      "Every sample difference will be within 0.26 oz of 1 oz",
      "Individual lemons and oranges vary by 0.26 oz from the mean",
      "There is a 26% chance that the sample difference equals the true difference"
    ],
    explanation: "σ_{x̄₁−x̄₂} measures how much the sample statistic x̄₁ − x̄₂ typically varies from the true difference μ₁ − μ₂. It describes variation across ALL possible sample pairs, not individual observations. 'Typically' or 'on average' is key language.",
    topicId: "5.8: Interpretation"
  },
  {
    scenarioText: "Two populations are both right-skewed. Samples of n₁ = 50 and n₂ = 45 are taken. A student claims x̄₁ − x̄₂ is NOT approximately normal because neither population is normal. Is the student correct?",
    correctAnswer: "No — the student is wrong. Both n₁ = 50 ≥ 30 AND n₂ = 45 ≥ 30, so the CLT applies to BOTH and x̄₁ − x̄₂ IS approximately normal",
    wrongOptions: [
      "Yes — both populations must be normal for x̄₁ − x̄₂ to be normal",
      "Yes — right-skewed populations can never produce normal sampling distributions",
      "No — only ONE sample size needs to be ≥ 30"
    ],
    explanation: "There are TWO paths to normality: (1) BOTH populations normal, OR (2) BOTH n ≥ 30. The student only checked condition 1. Since BOTH n₁ = 50 ≥ 30 AND n₂ = 45 ≥ 30, the CLT applies and x̄₁ − x̄₂ IS approximately normal.",
    topicId: "5.8: Shape Conditions"
  },
  {
    scenarioText: "Coffee Shop A: μ₁ = 12.1 oz, σ₁ = 0.3 oz, n₁ = 15. Coffee Shop B: μ₂ = 11.8 oz, σ₂ = 0.25 oz, n₂ = 20. A student calculates σ_{x̄₁−x̄₂} = (0.3/√15) − (0.25/√20) = 0.0215. What error did the student make?",
    correctAnswer: "The student subtracted σ/√n values instead of adding variances under a square root: σ = √(0.3²/15 + 0.25²/20) ≈ 0.094 oz",
    wrongOptions: [
      "The student should have added σ/√n values: 0.3/√15 + 0.25/√20 = 0.133 oz",
      "The student should have used σ₁ − σ₂ = 0.05 oz",
      "The student's calculation is correct"
    ],
    explanation: "Variances ALWAYS add, even for differences. σ_{x̄₁−x̄₂} = √(σ₁²/n₁ + σ₂²/n₂) = √(0.09/15 + 0.0625/20) = √(0.006 + 0.003125) = √0.009125 ≈ 0.094 oz. Never subtract standard deviations.",
    topicId: "5.8: Variance Addition"
  }
];
```

#### e. Add generator logic (insert before the FALLBACK block, around line 3465)

**L36: x̄₁−x̄₂ Parameters**
```js
// ========== L36: x̄₁−x̄₂ Distribution Parameters (5.8a) ==========
if (modeId === "l36-diff-mean-params") {
  const scen = drawFromBag('diffMeanContext_l36', diffMeanContextBank);

  const diffMu = Math.round((scen.mu1 - scen.mu2) * 100) / 100;
  const var1 = (scen.sigma1 * scen.sigma1) / scen.n1;
  const var2 = (scen.sigma2 * scen.sigma2) / scen.n2;
  const diffSD = Math.round(Math.sqrt(var1 + var2) * 1000) / 1000;
  const tenPct1 = scen.n1 < 0.10 * scen.N1;
  const tenPct2 = scen.n2 < 0.10 * scen.N2;

  ctx = {
    topicId: "5.8: x̄₁−x̄₂ Distribution Parameters",
    scenarioText: `${scen.context}.\n\nGroup 1 (${scen.label1}): μ₁ = ${scen.mu1} ${scen.unit}, σ₁ = ${scen.sigma1} ${scen.unit}, n₁ = ${scen.n1}, N₁ = ${scen.N1.toLocaleString()}\nGroup 2 (${scen.label2}): μ₂ = ${scen.mu2} ${scen.unit}, σ₂ = ${scen.sigma2} ${scen.unit}, n₂ = ${scen.n2}, N₂ = ${scen.N2.toLocaleString()}\n\nFind the mean and standard deviation of the sampling distribution of x̄₁ − x̄₂.`,
    givenText: `μ₁ = ${scen.mu1}, σ₁ = ${scen.sigma1}, n₁ = ${scen.n1} | μ₂ = ${scen.mu2}, σ₂ = ${scen.sigma2}, n₂ = ${scen.n2} | 10%: ${tenPct1 && tenPct2 ? "✓ Met for both" : "Check carefully"}`,
    mu1: `${scen.mu1}`, sigma1: `${scen.sigma1}`, n1: `${scen.n1}`, N1: `${scen.N1}`,
    mu2: `${scen.mu2}`, sigma2: `${scen.sigma2}`, n2: `${scen.n2}`, N2: `${scen.N2}`,
    unit: scen.unit,
    diffMeanMu: `${diffMu}`,
    diffMeanSD: `${diffSD}`
  };

  answers = {
    diffMeanMu: { value: diffMu, tolerance: 0.1 },
    diffMeanSD: { value: diffSD, tolerance: 0.1 }
  };

  scenario = ctx.scenarioText;
  return { context: ctx, graphConfig, answers, scenario };
}
```

**L37: Shape of x̄₁−x̄₂**
```js
// ========== L37: Shape of x̄₁−x̄₂ Distribution (5.8b) ==========
if (modeId === "l37-diff-mean-shape") {
  const scen = drawFromBag('diffMeanShape', diffMeanShapeBank);

  const normalAnswer = scen.isNormal
    ? "Yes, approximately normal"
    : "No, NOT approximately normal";

  ctx = {
    topicId: "5.8: Shape of x̄₁−x̄₂ Distribution",
    scenarioText: `Consider the following scenario:\n\n${scen.pop1Desc} with sample size n₁ = ${scen.n1}.\n${scen.pop2Desc} with sample size n₂ = ${scen.n2}.\n\nIs the sampling distribution of x̄₁ − x̄₂ approximately normal?`,
    givenText: scen.givenInfo,
    isNormal: `${scen.isNormal}`,
    n1: `${scen.n1}`,
    n2: `${scen.n2}`,
    reason: scen.reason,
    expectedExplanation: scen.reason
  };

  answers = {
    diffMeanShapeChoice: { value: normalAnswer },
    diffMeanShapeExplain: { value: scen.reason }
  };

  scenario = ctx.scenarioText;
  return { context: ctx, graphConfig, answers, scenario };
}
```

**L38: Interpret x̄₁−x̄₂ Parameters**
```js
// ========== L38: Interpret x̄₁−x̄₂ Parameters (5.8c) ==========
if (modeId === "l38-diff-mean-interpret") {
  const scen = drawFromBag('diffMeanInterpret', diffMeanInterpretBank);

  const allOptions = shuffle([scen.correctInterpretation, ...scen.wrongInterpretations]);
  const diffMu = Math.round((scen.mu1 - scen.mu2) * 100) / 100;
  const diffSD = Math.round(Math.sqrt(scen.sigma1 * scen.sigma1 / scen.n1 + scen.sigma2 * scen.sigma2 / scen.n2) * 1000) / 1000;

  ctx = {
    topicId: "5.8: Interpreting x̄₁−x̄₂ Parameters",
    scenarioText: `${scen.context}\n\n${scen.paramType === "mean"
      ? `The mean of the sampling distribution of x̄₁ − x̄₂ is μ_{x̄₁−x̄₂} = ${diffMu} ${scen.unit}. Which interpretation is correct?`
      : `The standard deviation of the sampling distribution of x̄₁ − x̄₂ is σ_{x̄₁−x̄₂} ≈ ${diffSD} ${scen.unit}. Which interpretation is correct?`}`,
    givenText: `μ₁ = ${scen.mu1}, σ₁ = ${scen.sigma1}, n₁ = ${scen.n1} | μ₂ = ${scen.mu2}, σ₂ = ${scen.sigma2}, n₂ = ${scen.n2} | Interpreting: ${scen.paramType === "mean" ? "μ_{x̄₁−x̄₂}" : "σ_{x̄₁−x̄₂}"}`,
    optA: allOptions[0],
    optB: allOptions[1],
    optC: allOptions[2],
    optD: allOptions[3],
    paramType: scen.paramType,
    mu1: `${scen.mu1}`, sigma1: `${scen.sigma1}`, n1: `${scen.n1}`,
    mu2: `${scen.mu2}`, sigma2: `${scen.sigma2}`, n2: `${scen.n2}`,
    unit: scen.unit
  };

  answers = {
    diffMeanInterpretAnswer: { value: scen.correctInterpretation }
  };

  scenario = ctx.scenarioText;
  return { context: ctx, graphConfig, answers, scenario };
}
```

**L39: x̄₁−x̄₂ Probability**
```js
// ========== L39: x̄₁−x̄₂ Probability (5.8d) ==========
if (modeId === "l39-diff-mean-probability") {
  const scen = drawFromBag('diffMeanContext_l39', diffMeanContextBank);

  const diffMu = scen.mu1 - scen.mu2;
  const var1 = (scen.sigma1 * scen.sigma1) / scen.n1;
  const var2 = (scen.sigma2 * scen.sigma2) / scen.n2;
  const diffSD = Math.sqrt(var1 + var2);

  // Generate a random observed difference 0.5–2.5 SD away from the true mean
  const sdMultiplier = (randInt(50, 250)) / 100 * (Math.random() < 0.5 ? 1 : -1);
  let obsDiff = diffMu + sdMultiplier * diffSD;
  // Round to reasonable precision
  if (Math.abs(diffMu) >= 100) {
    obsDiff = Math.round(obsDiff * 10) / 10;
  } else if (Math.abs(diffMu) >= 10) {
    obsDiff = Math.round(obsDiff * 100) / 100;
  } else {
    obsDiff = Math.round(obsDiff * 1000) / 1000;
  }

  // Pick direction
  const greaterThan = Math.random() < 0.5;
  const direction = greaterThan ? "GREATER THAN" : "LESS THAN";

  const zExact = (obsDiff - diffMu) / diffSD;
  const z = Math.round(zExact * 100) / 100;

  let prob;
  if (greaterThan) {
    prob = 1 - normalCDF(zExact);
  } else {
    prob = normalCDF(zExact);
  }
  prob = Math.round(prob * 10000) / 10000;

  const diffSDRounded = Math.round(diffSD * 1000) / 1000;
  const diffMuRounded = Math.round(diffMu * 100) / 100;

  ctx = {
    topicId: "5.8: x̄₁−x̄₂ Probability",
    scenarioText: `${scen.context}.\n\nGroup 1 (${scen.label1}): μ₁ = ${scen.mu1} ${scen.unit}, σ₁ = ${scen.sigma1} ${scen.unit}, n₁ = ${scen.n1}\nGroup 2 (${scen.label2}): μ₂ = ${scen.mu2} ${scen.unit}, σ₂ = ${scen.sigma2} ${scen.unit}, n₂ = ${scen.n2}\n\nWhat is the probability that x̄₁ − x̄₂ is ${direction} ${obsDiff} ${scen.unit}?`,
    givenText: `μ₁ = ${scen.mu1}, σ₁ = ${scen.sigma1}, n₁ = ${scen.n1} | μ₂ = ${scen.mu2}, σ₂ = ${scen.sigma2}, n₂ = ${scen.n2} | μ_{x̄₁−x̄₂} = ${diffMuRounded}, σ_{x̄₁−x̄₂} = ${diffSDRounded}`,
    mu1: `${scen.mu1}`, sigma1: `${scen.sigma1}`, n1: `${scen.n1}`,
    mu2: `${scen.mu2}`, sigma2: `${scen.sigma2}`, n2: `${scen.n2}`,
    obsDiff: `${obsDiff}`,
    diffMeanSD: `${diffSDRounded}`,
    diffMeanMu: `${diffMuRounded}`,
    unit: scen.unit,
    direction: direction,
    label1: scen.label1,
    label2: scen.label2,
    zScore: `${z}`,
    probability: `${prob}`
  };

  answers = {
    diffMeanZScore: { value: z, tolerance: 0.05 },
    diffMeanProb: { value: prob, tolerance: 0.005 }
  };

  scenario = ctx.scenarioText;
  return { context: ctx, graphConfig, answers, scenario };
}
```

**L40: Interpret x̄₁−x̄₂ Probability**
```js
// ========== L40: Interpret x̄₁−x̄₂ Probability (5.8e) ==========
if (modeId === "l40-diff-mean-interpret-prob") {
  const scen = drawFromBag('diffMeanContext_l40', diffMeanContextBank);

  const diffMu = scen.mu1 - scen.mu2;
  const var1 = (scen.sigma1 * scen.sigma1) / scen.n1;
  const var2 = (scen.sigma2 * scen.sigma2) / scen.n2;
  const diffSD = Math.sqrt(var1 + var2);

  // ~40% unusual, ~60% not unusual
  const isUnusual = Math.random() < 0.4;
  let sdMultiplier;
  if (isUnusual) {
    sdMultiplier = (randInt(170, 280)) / 100;
  } else {
    sdMultiplier = (randInt(30, 155)) / 100;
  }
  const sign = Math.random() < 0.5 ? 1 : -1;
  let obsDiff = diffMu + sign * sdMultiplier * diffSD;
  if (Math.abs(diffMu) >= 100) {
    obsDiff = Math.round(obsDiff * 10) / 10;
  } else if (Math.abs(diffMu) >= 10) {
    obsDiff = Math.round(obsDiff * 100) / 100;
  } else {
    obsDiff = Math.round(obsDiff * 1000) / 1000;
  }

  const greaterThan = (obsDiff - diffMu) >= 0;
  const direction = greaterThan ? "greater than" : "less than";
  const directionOrMore = greaterThan ? "or greater" : "or less";

  const zExact = (obsDiff - diffMu) / diffSD;
  const z = Math.round(zExact * 100) / 100;

  let prob;
  if (greaterThan) {
    prob = 1 - normalCDF(zExact);
  } else {
    prob = normalCDF(zExact);
  }
  prob = Math.round(prob * 10000) / 10000;

  const probPct = Math.round(prob * 10000) / 100;
  const diffSDRounded = Math.round(diffSD * 1000) / 1000;
  const diffMuRounded = Math.round(diffMu * 100) / 100;

  const unusualAnswer = prob < 0.05 ? "Unusual" : "Not unusual";

  ctx = {
    topicId: "5.8: Interpreting Probability",
    scenarioText: `${scen.context}.\n\nGroup 1 (${scen.label1}): μ₁ = ${scen.mu1} ${scen.unit}, σ₁ = ${scen.sigma1} ${scen.unit}, n₁ = ${scen.n1}\nGroup 2 (${scen.label2}): μ₂ = ${scen.mu2} ${scen.unit}, σ₂ = ${scen.sigma2} ${scen.unit}, n₂ = ${scen.n2}\n\nThe probability that x̄₁ − x̄₂ is ${direction} ${obsDiff} ${scen.unit} is ${prob} (${probPct}%).\n\nInterpret this probability in context and determine whether this result is unusual.`,
    givenText: `μ₁ = ${scen.mu1}, σ₁ = ${scen.sigma1}, n₁ = ${scen.n1} | μ₂ = ${scen.mu2}, σ₂ = ${scen.sigma2}, n₂ = ${scen.n2} | P(x̄₁ − x̄₂ ${greaterThan ? ">" : "<"} ${obsDiff}) = ${prob}`,
    label1: scen.label1,
    label2: scen.label2,
    mu1: `${scen.mu1}`, sigma1: `${scen.sigma1}`, n1: `${scen.n1}`,
    mu2: `${scen.mu2}`, sigma2: `${scen.sigma2}`, n2: `${scen.n2}`,
    obsDiff: `${obsDiff}`,
    direction: direction,
    directionOrMore: directionOrMore,
    probability: `${prob}`,
    probabilityPct: `${probPct}`,
    unusualAnswer: unusualAnswer,
    unit: scen.unit,
    expectedInterpretation: `Getting a difference (${scen.label1} − ${scen.label2}) in sample mean ${scen.measurable}s of ${obsDiff} ${scen.unit} ${directionOrMore} happens in about ${probPct}% of all possible samples of size ${scen.n1} from ${scen.label1} and size ${scen.n2} from ${scen.label2}. This is ${unusualAnswer === "Unusual" ? "" : "not "}unusual.`
  };

  answers = {
    diffMeanInterpretProbText: { value: ctx.expectedInterpretation },
    diffMeanUnusualChoice: { value: unusualAnswer === "Unusual" ? "Unusual — probability is less than 5%" : "Not unusual — probability is 5% or more" }
  };

  scenario = ctx.scenarioText;
  return { context: ctx, graphConfig, answers, scenario };
}
```

**L41: 5.8 Capstone**
```js
// ========== L41: 5.8 Capstone ==========
if (modeId === "l41-capstone-58") {
  const scen = drawFromBag('capstone58', capstone58Bank);

  const allOptions = shuffle([scen.correctAnswer, ...scen.wrongOptions]);

  ctx = {
    topicId: scen.topicId,
    scenarioText: scen.scenarioText,
    givenText: "Apply concepts from Topic 5.8 (Sampling Distributions for Differences in Sample Means).",
    optA: allOptions[0],
    optB: allOptions[1],
    optC: allOptions[2],
    optD: allOptions[3],
    explanation: scen.explanation,
    expectedExplanation: scen.explanation
  };

  answers = {
    capstone58Answer: { value: scen.correctAnswer },
    capstone58Explain: { value: scen.explanation }
  };

  scenario = scen.scenarioText;
  return { context: ctx, graphConfig, answers, scenario };
}
```

---

### 3. `cartridges/apstats-u5-sampling-dist/grading-rules.js`

#### a. Add field IDs to existing lists

Find the `AI_ONLY_FIELDS` array (which contains textarea field IDs for AI grading) and add:
```js
"diffMeanShapeExplain",
"capstone58Explain"
```

Find the `NUMERIC_FIELDS` array and add:
```js
"diffMeanMu", "diffMeanSD", "diffMeanZScore", "diffMeanProb"
```

#### b. Add grading rules (append before the final fallback return)

**diffMeanMu** — Same pattern as `meanMu` but for μ₁ − μ₂:
- Error check: student gave μ₁ + μ₂ (added instead of subtracted) → I with feedback
- Error check: student gave μ₁ or μ₂ alone → I with feedback
- Tolerance: 0.1
- E: within tolerance, P: within 0.5, I: otherwise

**diffMeanSD** — Same pattern as `meanSigma` but for √(σ₁²/n₁ + σ₂²/n₂):
- Error check: student gave √(σ₁² + σ₂²) (forgot /n) → I with "forgot to divide by n"
- Error check: student gave σ₁/√n₁ − σ₂/√n₂ (subtracted SDs) → I with "variances ALWAYS add"
- Error check: student gave σ₁/√n₁ + σ₂/√n₂ (added SDs instead of variances) → P with feedback
- Error check: student gave variance (σ₁²/n₁ + σ₂²/n₂) without square root → P with "take the square root"
- Tolerance: 0.1
- E/P/I as standard

**diffMeanShapeChoice** — Pattern matching `meanShapeChoice`:
- Exact match to expected → E
- Wrong → I, show reason from context

**diffMeanShapeExplain** — Keyword-based like `meanShapeExplain`:
- Keywords: "normal", "population", "sample size", "n₁", "n₂", "CLT", "30", "both"
- E: mentions BOTH populations + sample sizes/CLT + substance (≥8 words)
- P: mentions some relevant concepts
- I: insufficient explanation
- Critical keyword: "both" — unique to 5.8 (must check BOTH populations)

**diffMeanInterpretAnswer** — Same pattern as `meanInterpretAnswer`:
- Exact match → E
- Common wrong keywords ("every", "exactly", "always", "guaranteed") → I with explanation
- Otherwise → I with interpretation guidance

**diffMeanZScore** — Same pattern as `meanZScore`:
- Error check: wrong subtraction order (−expected) → I
- Error check: divided by σ₁ or σ₂ instead of σ_{x̄₁−x̄₂} → I
- Tolerance: 0.05
- E/P/I as standard

**diffMeanProb** — Same pattern as `meanProb`:
- Error check: complement error (1 − expected) → I with direction hint
- Tolerance: 0.005
- E/P/I as standard

**diffMeanInterpretProbText** — Same pattern as `diffInterpretProbText` (from 5.6e):
- Keywords: "all possible samples", "difference", "sample mean", units, percentage
- Must reference both sample sizes and both populations
- E: mentions ≥3 key concepts with substance
- P: mentions some
- I: insufficient

**diffMeanUnusualChoice** — Same pattern as `diffUnusualChoice` (from 5.6e):
- Exact match → E
- Wrong → I with "if P < 0.05 → unusual"

**capstone58Answer** — Same pattern as `capstone57Answer`:
- Normalized match → E with explanation
- Wrong → I with explanation

**capstone58Explain** — Same pattern as `capstone57Explain`:
- Keywords: "x̄₁ − x̄₂", "difference", "means", formula keywords, CLT, interpretation, probability
- E: ≥2 categories + substance, or 1 category + reasoning + substance
- P: 1 category + substance
- I: insufficient

---

### 4. `cartridges/apstats-u5-sampling-dist/ai-grader-prompt.txt`

Append at end of the existing prompt template, the same pattern as Topic 5.7 but for differences:

```
## Topic 5.8: Sampling Distributions for Differences in Sample Means

### Key formulas
- μ_{x̄₁−x̄₂} = μ₁ − μ₂
- σ_{x̄₁−x̄₂} = √(σ₁²/n₁ + σ₂²/n₂)
- z = (observed difference − μ_{x̄₁−x̄₂}) / σ_{x̄₁−x̄₂}
- Conditions: 10% condition for BOTH samples; samples must be independent
- Shape: approximately normal when BOTH populations are normal, OR BOTH n₁ ≥ 30 AND n₂ ≥ 30

### Common errors to watch for
- Adding/subtracting standard deviations directly instead of using √(σ₁²/n₁ + σ₂²/n₂)
- Adding means instead of subtracting: μ₁ + μ₂ instead of μ₁ − μ₂
- Forgetting to divide σ² by n for each group
- Thinking only ONE population needs to be normal, or only ONE n ≥ 30
- Not specifying the subtraction order (which group minus which)
- Interpreting σ_{x̄₁−x̄₂} as variation in individual observations rather than sample mean differences
- For shape: checking n₁ + n₂ ≥ 30 instead of BOTH n₁ ≥ 30 AND n₂ ≥ 30

### Interpretation requirements
- Context: reference the specific populations being compared
- Units: always include units
- "All possible samples": reference samples of size n₁ from pop 1 AND size n₂ from pop 2
- Subtraction order: explicitly state which group minus which (e.g., "lemons − oranges")
- For σ: use "typically" or "on average" language
- For probability: state % or decimal AND whether it IS or IS NOT unusual (< 5% threshold)
```

---

## Summary of Changes

| File | What Changes |
|------|-------------|
| `manifest.json` | Name → 5.1-5.8, add 3 skills, 6 new modes, 12 hints, 6 progression tiers, fix l35 message |
| `generator.js` | Add 4 data banks (~100 scenarios), 6 generator blocks |
| `grading-rules.js` | Add 12 field grading rules, update field lists |
| `ai-grader-prompt.txt` | Add Topic 5.8 section |

**Total new fields**: 12 (across 6 modes)
**Total new bank scenarios**: ~34 (10 context, 10 shape, 8 interpret, 6 capstone)
**New mode IDs**: l36-l41

---

## Verification Checklist

After implementation, confirm:

1. `npm test` passes (all existing tests still pass)
2. `npm run dev` → load cartridge → modes l36–l41 appear in mode list
3. Each mode generates problems without errors
4. Answers grade correctly:
   - l36: μ₁−μ₂ and √(σ₁²/n₁ + σ₂²/n₂) with tolerance 0.1
   - l37: shape choice + explain
   - l38: correct interpretation selected
   - l39: z-score (tol 0.05) and probability (tol 0.005)
   - l40: interpretation text + unusual/not unusual
   - l41: capstone dropdown + explanation
5. Common error detection works (variance trap, complement error, wrong subtraction order)
6. Progression: l35 → l36 → l37 → l38 → l39 → l40 → l41
7. Hints display correctly for all 12 new fields
