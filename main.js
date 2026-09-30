const { Plugin, Modal, Setting, Notice } = require("obsidian");

function buildTable(n, extraCols) {
  const vars = Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i));
  const header = [...vars, ...extraCols];
  const line = (cells) => "| " + cells.join(" | ") + " |";
  const rows = [];
  for (let i = 0; i < 2 ** n; i++) {
    // first row all 1s, last row all 0s (textbook order)
    const vals = vars.map((_, j) => 1 - ((i >> (n - 1 - j)) & 1));
    rows.push(line([...vals, ...extraCols.map(() => " ")]));
  }
  return [line(header), line(header.map(() => "---")), ...rows].join("\n") + "\n";
}

class TableModal extends Modal {
  constructor(app, onSubmit) {
    super(app);
    this.onSubmit = onSubmit;
    this.n = 2;
    this.cols = "";
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h3", { text: "Truth table framework" });

    new Setting(contentEl).setName("Number of variables (A, B, ...)").addText((t) =>
      t.setValue("2").onChange((v) => (this.n = parseInt(v, 10)))
    );
    new Setting(contentEl)
      .setName("Extra columns")
      .setDesc("Comma-separated headers, e.g. A∧B, ¬A∨B")
      .addText((t) => t.onChange((v) => (this.cols = v)));
    new Setting(contentEl).addButton((b) =>
      b.setButtonText("Insert").setCta().onClick(() => {
        if (!Number.isInteger(this.n) || this.n < 1 || this.n > 8) {
          new Notice("Enter a number of variables between 1 and 8.");
          return;
        }
        const extra = this.cols.split(",").map((s) => s.trim()).filter(Boolean);
        this.close();
        this.onSubmit(buildTable(this.n, extra));
      })
    );
  }
  onClose() {
    this.contentEl.empty();
  }
}

module.exports = class TruthTableFrame extends Plugin {
  onload() {
    this.addCommand({
      id: "insert-truth-table-frame",
      name: "Insert truth table framework",
      editorCallback: (editor) => {
        new TableModal(this.app, (md) => editor.replaceSelection(md)).open();
      },
    });
  }
};
