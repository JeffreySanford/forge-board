# ForgeBoard Angular ESBuild Migration Journey

## The American Spirit of Innovation

> “The American, by nature, is optimistic. They are experimental, an inventor, and a builder who builds best when called upon to build greatly.” — John F. Kennedy

---

## Ollama + CodeLlama Setup (with Enhanced Standards)

### Step-by-Step Instructions

```bash
# Step 1: Check for running Ollama server
if lsof -i :11434 | grep -q LISTEN; then
  echo "Ollama server already running on port 11434."
else
  echo "No active Ollama server detected."
fi

# Step 2: Ensure quantized model is present
MODEL_PATH="$HOME/models/codellama/7b-instruct-q4-0.gguf"
if [[ -s "$MODEL_PATH" ]]; then
  echo "Quantized model already present: $MODEL_PATH"
else
  echo "Downloading quantized model..."
  mkdir -p ~/models/codellama
  curl -L "https://huggingface.co/TheBloke/CodeLlama-7B-Instruct-GGUF/resolve/main/codellama-7b-instruct.Q4_0.gguf" \
    -o "$MODEL_PATH"
fi

# Step 3: Define Modelfile
echo 'FROM /home/jeffrey/models/codellama/7b-instruct-q4-0.gguf
SYSTEM "You are a coding assistant for Angular Material 3, RxJS, NestJS, and Go.
You must adhere to ForgeBoard coding standards including strict typing, shared DTOs,
RxJS hot observables, no async/promises, use of NX CLI, and zero-trust FedRAMP practices." 
' > ~/models/codellama/Modelfile

# Step 4: Register the model
if ! ollama list | grep -q "codellama-q4-0"; then
  ollama create codellama-q4-0 -f "$HOME/models/codellama/Modelfile"
fi

# Step 5: Start Ollama server
if ! lsof -i :11434 | grep -q LISTEN; then
  nohup ollama serve > /dev/null 2>&1 &
  sleep 1
fi
```

---

## Integration into Continue (VS Code)

In your `settings.json`:

```json
{
  "continue.provider": "ollama",
  "continue.apiBase": "http://localhost:11434/",
  "continue.model": "codellama-q4-0"
}
```

---

## Summary Table

| Element              | Status  |
|----------------------|---------|
| Ollama Version       | >= 0.7  |
| Model Present        | Yes     |
| ForgeBoard Modelfile | Applied |
| Continue Configured  | Yes     |