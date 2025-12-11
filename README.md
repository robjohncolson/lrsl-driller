# Driller Platform

**A subject-agnostic drill/quiz platform for teachers.** Create interactive practice exercises for any topic - from AP Statistics to Algebra to anything you teach.

> Think of it like a game console: the platform is the console, lessons are cartridges. Swap cartridges, keep the same powerful engine.

## Quick Links

- **[Setup Guide](https://robjohncolson.github.io/lrsl-driller/)** - Get your own instance running in 30-45 minutes
- **[Live Demo](https://lrsl-driller.vercel.app)** - Try the existing cartridges
- **[Cartridge Development Guide](./CARTRIDGE-DEVELOPMENT-GUIDE.md)** - Technical reference for cartridge structure

---

## What's Included

Three ready-to-use cartridges:

| Cartridge | Subject | What Students Practice |
|-----------|---------|----------------------|
| LSRL Interpretation | AP Statistics | Writing slope, intercept, and correlation interpretations |
| Residuals | AP Statistics | Calculating and interpreting residuals, analyzing residual plots |
| Simplifying Radicals | Algebra 2 | Prime factorization, perfect squares, complex numbers |

---

## Creating Your Own Cartridges with AI

**You don't need to be a programmer.** Use AI assistants like Google AI Studio, ChatGPT, or Claude to generate cartridges from your existing worksheets, lesson ideas, or curriculum standards.

### The Basic Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│  1. GATHER YOUR CONTENT                                         │
│     - A worksheet you want to make interactive                  │
│     - Learning objectives from your curriculum                  │
│     - Or just an idea: "I want students to practice X"          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  2. PROMPT THE AI                                               │
│     - Give it the CARTRIDGE-DEVELOPMENT-GUIDE.md as context     │
│     - Give it an existing cartridge as an example               │
│     - Describe what you want students to practice               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  3. TEST & ITERATE                                              │
│     - Put the generated files in your repo                      │
│     - Push to GitHub → auto-deploys to Vercel                   │
│     - Try it out, note what needs fixing                        │
│     - Go back to AI with feedback, repeat                       │
└─────────────────────────────────────────────────────────────────┘
```

### Step-by-Step: Using Google AI Studio (Free)

1. **Open AI Studio**: Go to [aistudio.google.com](https://aistudio.google.com)

2. **Start a new chat** and paste this context prompt:

```
I want to create a drill cartridge for the Driller education platform.
Here's how cartridges work:

[Paste the contents of CARTRIDGE-DEVELOPMENT-GUIDE.md here]

And here's an example of a working cartridge:

[Paste the contents of an existing cartridge's manifest.json, generator.js,
and grading-rules.js - pick whichever is closest to what you want to create]
```

3. **Describe what you want**:

```
Now help me create a cartridge for [YOUR TOPIC]. Here's what I want:

Topic: [e.g., "Identifying logical fallacies in arguments"]
Subject: [e.g., "AP English Language"]
What students do: [e.g., "Read a short argument and identify which fallacy it contains"]

Here are some example problems from my worksheet:
[Paste 3-5 example problems]

The correct answers are:
[List the answers]
```

4. **AI generates the files** - It will create:
   - `manifest.json` - defines the UI and structure
   - `generator.js` - creates random problems
   - `grading-rules.js` - scores student answers
   - `ai-grader-prompt.txt` (optional) - for free-response grading

5. **Deploy and test**:
   - Create folder: `cartridges/your-topic-id/`
   - Add the 4 files
   - Add your cartridge to the dropdown in `platform/app.html`
   - Push to GitHub
   - Test on your Vercel site

6. **Iterate**: Something not working? Tell the AI:
   - "The grading is too strict, students get marked wrong for minor wording differences"
   - "I need to add a hint for the first question"
   - "Can we add a harder mode that unlocks after 10 gold stars?"

### Using ChatGPT or Claude

Same process - just paste the guide and example cartridge into your conversation. These AIs are excellent at:

- Understanding your pedagogical goals
- Generating realistic problem variations
- Creating fair grading rubrics
- Suggesting progressive difficulty levels

**Pro tip**: Claude (claude.ai) is particularly good at understanding nuanced grading criteria for free-response questions.

---

## What Makes a Good Cartridge Prompt

### Include These Elements

**1. Clear learning objective**
> "Students should be able to identify the type of triangle given three side lengths"

**2. Example problems (3-5 minimum)**
> "Sides: 3, 4, 5 → Right triangle"
> "Sides: 5, 5, 5 → Equilateral triangle"

**3. What counts as correct**
> "Must identify the correct triangle type. Accept 'right', 'right triangle', 'right-angled'"

**4. Common mistakes to watch for**
> "Students often confuse isosceles and equilateral"

**5. Desired difficulty progression**
> "Level 1: Integer side lengths. Level 2: Decimal side lengths. Level 3: Must also calculate area"

### Example Prompt for a New Cartridge

```
Create a cartridge for practicing unit conversions in Chemistry.

LEARNING OBJECTIVE:
Students convert between grams, moles, and particles using molar mass and Avogadro's number.

EXAMPLE PROBLEMS:
1. How many moles are in 36 grams of water (H2O)? → 2 moles
2. How many molecules are in 0.5 moles of CO2? → 3.01 × 10²³ molecules
3. What is the mass of 3 moles of NaCl? → 175.5 grams

WHAT'S CORRECT:
- Numeric answer within 2% tolerance
- Accept scientific notation or decimal
- Units required in answer

DIFFICULTY PROGRESSION:
- Level 1: Simple conversions (g → mol or mol → particles)
- Level 2: Two-step conversions (g → mol → particles)
- Level 3: Include percent composition calculations

COMMON ERRORS:
- Forgetting to use molar mass
- Multiplying instead of dividing (or vice versa)
- Wrong number of sig figs (but don't penalize this heavily)
```

---

## Iteration Tips

Creating a good cartridge usually takes 2-4 cycles. Here's how to refine:

### Grading Too Strict?

Tell the AI:
> "Students who write '2.0 moles' are getting marked wrong when the answer is '2 moles'. Make the numeric grading more lenient."

### Problems Too Repetitive?

> "Add more variety to the problem generator. Include different compounds, not just water and CO2."

### Students Confused?

> "Add hints that show the formula without giving away the answer. Something like 'Remember: moles = grams ÷ molar mass'"

### Want More Challenge?

> "Add a Level 3 mode that requires students to write out their work in a text box, graded by AI for showing the conversion factor."

---

## File Structure Reference

```
your-cartridge/
├── manifest.json        ← UI structure, modes, hints, progression
├── generator.js         ← Problem generation logic
├── grading-rules.js     ← Scoring rules (E/P/I)
└── ai-grader-prompt.txt ← (Optional) Instructions for AI grading
```

See [CARTRIDGE-DEVELOPMENT-GUIDE.md](./CARTRIDGE-DEVELOPMENT-GUIDE.md) for detailed specs.

---

## Platform Features

- **E/P/I Grading**: Essentially correct, Partially correct, Incorrect
- **Dual Grading**: Keyword matching + AI grading run simultaneously
- **Gamification**: Streaks, stars (Gold/Silver/Bronze/Tin), unlockable modes
- **Teacher Review**: Students can request human review; teachers see pending queue
- **Time Tracking**: Session and problem-level timing for engagement analysis
- **Real-time Updates**: WebSocket notifications for teacher dashboard

---

## Getting Help

- **Setup Issues**: Follow the [Setup Guide](https://robjohncolson.github.io/lrsl-driller/)
- **Cartridge Development**: Read [CARTRIDGE-DEVELOPMENT-GUIDE.md](./CARTRIDGE-DEVELOPMENT-GUIDE.md)
- **Bug Reports**: [Open an issue](https://github.com/robjohncolson/lrsl-driller/issues)

---

## Tech Stack

- **Frontend**: Vanilla JS + Tailwind CSS (via CDN)
- **Backend**: Node.js + Express + WebSocket
- **Database**: PostgreSQL (Supabase)
- **Hosting**: Vercel (frontend) + Railway (backend)
- **AI Grading**: Google Gemini / Groq APIs

---

## License

MIT - Use it, modify it, share it. Built for teachers, by teachers.
