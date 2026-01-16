# Template Cartridge

This is a blank slate cartridge template. Use it as a starting point for generating new lesson cartridges.

## Usage

1. **Copy this directory** to a new folder with your cartridge ID:
   ```bash
   cp -r cartridges/_template cartridges/your-topic-id
   ```

2. **Update manifest.json**:
   - Change `meta.id` to match your directory name
   - Update `meta.name`, `meta.subject`, `meta.description`
   - Add your curriculum standard codes to `config.skills`
   - Design your modes and input fields
   - Write hints for each field
   - Set up progression with appropriate gold requirements

3. **Implement generator.js**:
   - Create scenario banks for each level
   - Implement problem generation for each modeId
   - Return all required context variables
   - Return answers for all input fields

4. **Implement grading-rules.js**:
   - Handle each fieldId from your manifest
   - Define scoring criteria for E/P/I
   - Write helpful feedback messages

5. **Customize ai-grader-prompt.txt**:
   - Replace [SUBJECT] and [TOPIC]
   - Define grading criteria for each open-response field
   - List key vocabulary and common misconceptions

6. **Add to registry** (cartridges/registry.json):
   ```json
   {
     "id": "your-topic-id",
     "name": "Your Topic Name",
     "subject": "Your Subject",
     "description": "Brief description",
     "shortCode": "CODE"
   }
   ```

7. **Add to app dropdown** (platform/app.html):
   ```html
   <option value="your-topic-id">Your Topic Name</option>
   ```

## File Checklist

- [ ] `manifest.json` - Valid JSON with all required sections
- [ ] `generator.js` - Exports `generateProblem(modeId, context, mode)`
- [ ] `grading-rules.js` - Exports `gradeField(fieldId, answer, context)`
- [ ] `ai-grader-prompt.txt` - Template with {{placeholders}}
- [ ] `contexts.json` - (Optional) Delete if not using contexts

## Testing

```bash
npm run dev
# Open http://localhost:5173/platform/app.html
# Select your cartridge from dropdown
# Test each level
# Check browser console for errors
```

## Reference Documents

- `CARTRIDGE-STATE-MACHINE.md` - Visual lifecycle diagrams
- `CARTRIDGE-GENERATION-PROMPT.md` - Comprehensive LLM instructions
- `CARTRIDGE-DEVELOPMENT-GUIDE.md` - Full development guide
