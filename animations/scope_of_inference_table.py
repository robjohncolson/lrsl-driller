"""
Scope of Inference 2x2 Table (AP Stats Unit 3, Topic 3.2e)

Shows the four-cell table: random selection x random assignment.

Run with: manim -qm --format=mp4 scope_of_inference_table.py ScopeOfInferenceTable
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
RED_3B1B = "#EF4444"
ORANGE_3B1B = "#F97316"


class ScopeOfInferenceTable(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Scope of Inference", font_size=42, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ========== BUILD 2x2 GRID ==========
        # Column headers
        col1 = Text("Random\nAssignment?", font_size=18, color=ManimColor(ORANGE_3B1B), weight=BOLD)
        col_yes = Text("Yes", font_size=20, color=ManimColor(GREEN_3B1B), weight=BOLD)
        col_no = Text("No", font_size=20, color=ManimColor(RED_3B1B), weight=BOLD)

        # Row headers
        row_label = Text("Random\nSelection?", font_size=18, color=ManimColor(BLUE_3B1B), weight=BOLD)
        row_yes = Text("Yes", font_size=20, color=ManimColor(GREEN_3B1B), weight=BOLD)
        row_no = Text("No", font_size=20, color=ManimColor(RED_3B1B), weight=BOLD)

        # Cells
        cell_yy = VGroup(
            Text("Generalize", font_size=16, color=ManimColor(GREEN_3B1B)),
            Text("+", font_size=16, color=GREY_B),
            Text("Causation", font_size=16, color=ManimColor(GREEN_3B1B)),
        ).arrange(DOWN, buff=0.04)

        cell_yn = VGroup(
            Text("Generalize", font_size=16, color=ManimColor(GREEN_3B1B)),
            Text("only", font_size=16, color=GREY_B),
        ).arrange(DOWN, buff=0.04)

        cell_ny = VGroup(
            Text("Causation", font_size=16, color=ManimColor(GREEN_3B1B)),
            Text("only", font_size=16, color=GREY_B),
        ).arrange(DOWN, buff=0.04)

        cell_nn = VGroup(
            Text("Neither", font_size=16, color=ManimColor(RED_3B1B)),
        )

        # Position everything in a grid
        cx, cy = 0, -0.3
        spacing_x, spacing_y = 2.8, 1.5

        col1.move_to([cx - spacing_x, cy + spacing_y + 0.4, 0])
        col_yes.move_to([cx, cy + spacing_y, 0])
        col_no.move_to([cx + spacing_x, cy + spacing_y, 0])
        row_label.move_to([cx - spacing_x - 1.2, cy, 0])
        row_yes.move_to([cx - spacing_x, cy, 0])
        row_no.move_to([cx - spacing_x, cy - spacing_y, 0])

        cell_yy.move_to([cx, cy, 0])
        cell_yn.move_to([cx + spacing_x, cy, 0])
        cell_ny.move_to([cx, cy - spacing_y, 0])
        cell_nn.move_to([cx + spacing_x, cy - spacing_y, 0])

        # Grid lines
        h_line1 = Line([cx - spacing_x - 0.5, cy + spacing_y / 2, 0],
                       [cx + spacing_x + 1, cy + spacing_y / 2, 0], color=GREY_B)
        h_line2 = Line([cx - spacing_x - 0.5, cy - spacing_y / 2, 0],
                       [cx + spacing_x + 1, cy - spacing_y / 2, 0], color=GREY_B)
        v_line = Line([cx - spacing_x / 2, cy + spacing_y + 0.8, 0],
                      [cx - spacing_x / 2, cy - spacing_y - 0.6, 0], color=GREY_B)

        grid = VGroup(h_line1, h_line2, v_line)

        self.play(
            Create(grid),
            Write(col1), Write(col_yes), Write(col_no),
            Write(row_label), Write(row_yes), Write(row_no),
            run_time=0.6,
        )

        # Animate cells one at a time
        cells = [(cell_yy, "BEST"), (cell_yn, ""), (cell_ny, "MOST COMMON"), (cell_nn, "")]
        for cell, note_text in cells:
            self.play(Write(cell), run_time=0.4)
            self.wait(0.3)

        # ========== HIGHLIGHT BEST ==========
        best_box = SurroundingRectangle(cell_yy, color=ManimColor(GREEN_3B1B), buff=0.15)
        self.play(Create(best_box), run_time=0.3)

        most_common_box = SurroundingRectangle(cell_ny, color=ManimColor(ORANGE_3B1B), buff=0.15)
        common_label = Text("(most experiments)", font_size=14, color=ManimColor(ORANGE_3B1B))
        common_label.next_to(cell_ny, RIGHT, buff=0.8)
        self.play(Create(most_common_box), Write(common_label), run_time=0.4)
        self.wait(0.5)

        closing = Text(
            "Random selection generalizes. Random assignment proves causation.",
            font_size=18, color=YELLOW_3B1B,
        )
        closing.to_edge(DOWN, buff=0.4)
        closing_box = SurroundingRectangle(closing, color=ManimColor(YELLOW_3B1B), buff=0.12, corner_radius=0.1)
        self.play(Write(closing), Create(closing_box), run_time=0.5)
        self.wait(1.5)
