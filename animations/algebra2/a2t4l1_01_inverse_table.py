"""
Level 1: Inverse Variation — Finding a Missing Table Value
Shows how xy = k (constant) lets you find any missing value in an
inverse-variation table.

Run with: python -m manim -qm --format=mp4 a2t4l1_01_inverse_table.py InverseTableScene
"""
from manim import *


# ── Color palette (Animation Precision Spec) ──────────────────────────
X_COL = BLUE          # x-values
Y_COL = YELLOW        # y-values
K_COL = GREEN         # constants / correct
ERR_COL = RED         # errors / missing
GOLD_COL = GOLD       # highlights / final answers
STRUCT_COL = WHITE    # structure
GHOST_COL = GREY      # de-emphasized


class InverseTableScene(Scene):
    """One MP4 asset for mode l01-missing-table."""

    # ── Data (matches generator bank item 2) ──────────────────────────
    XS = [2, 3, 4, 6]
    YS = [12, 8, 6, None]
    K = 24
    MISSING_IDX = 3
    MISSING_ANSWER = 4

    # ── Table layout constants ────────────────────────────────────────
    CELL_W = 1.4
    ROW_H = 0.65

    def construct(self):
        self.scene_table_reveal()
        self.scene_rectangle_metaphor()
        self.scene_solve_missing()
        self.scene_insight()

    # ──────────────────────────────────────────────────────────────────
    # Scene 1: Table + Constant Product Reveal  (~12s)
    # ──────────────────────────────────────────────────────────────────
    def scene_table_reveal(self):
        # ── Build header row ──────────────────────────────────────────
        header_x = Text("x", font_size=30, color=X_COL)
        header_y = Text("y", font_size=30, color=Y_COL)

        # ── Build data cells ──────────────────────────────────────────
        x_cells = [
            MathTex(str(x), font_size=32, color=X_COL)
            for x in self.XS
        ]
        y_cells = []
        for y in self.YS:
            if y is None:
                y_cells.append(MathTex(r"?", font_size=32, color=ERR_COL))
            else:
                y_cells.append(MathTex(str(y), font_size=32, color=Y_COL))

        # ── Position everything on a grid ─────────────────────────────
        origin = UP * 0.5 + LEFT * 1.5  # top-left anchor of data area

        def cell_center(row, col):
            """row 0 = header, 1 = x-values, 2 = y-values.  col 0..3."""
            return origin + RIGHT * col * self.CELL_W + DOWN * row * self.ROW_H

        header_x.move_to(origin + LEFT * self.CELL_W + DOWN * 1 * self.ROW_H)
        header_y.move_to(origin + LEFT * self.CELL_W + DOWN * 2 * self.ROW_H)

        for c in range(4):
            x_cells[c].move_to(cell_center(1, c))
            y_cells[c].move_to(cell_center(2, c))

        # ── Grid lines ───────────────────────────────────────────────
        left = origin[0] - self.CELL_W * 1.7
        right = origin[0] + self.CELL_W * 3.5
        top_y = origin[1] + self.ROW_H * 0.45

        h_lines = VGroup()
        for r in range(4):
            y_pos = top_y - r * self.ROW_H
            h_lines.add(Line(
                start=[left, y_pos, 0],
                end=[right, y_pos, 0],
                color=GHOST_COL, stroke_width=1,
            ))

        v_sep_x = origin[0] - self.CELL_W * 0.5
        v_line = Line(
            start=[v_sep_x, top_y, 0],
            end=[v_sep_x, top_y - 3 * self.ROW_H, 0],
            color=GHOST_COL, stroke_width=1,
        )

        # ── Animate table appearance ─────────────────────────────────
        all_cells = VGroup(header_x, header_y, *x_cells, *y_cells)
        self.play(
            FadeIn(all_cells),
            *[Create(l) for l in h_lines],
            Create(v_line),
            run_time=1.0,
        )
        self.wait(0.5)

        # ── Reveal products one column at a time ─────────────────────
        product_labels = []
        for c in range(4):
            if self.YS[c] is not None:
                prod_val = self.XS[c] * self.YS[c]
                prod_tex = MathTex(
                    str(self.XS[c]), r"\times", str(self.YS[c]),
                    r"=", str(prod_val),
                    font_size=28,
                )
                prod_tex[0].set_color(X_COL)
                prod_tex[2].set_color(Y_COL)
                prod_tex[4].set_color(K_COL)
                prod_tex.move_to(DOWN * 2.2 + RIGHT * (c - 1.5) * 1.8)

                x_rect = SurroundingRectangle(
                    x_cells[c], color=X_COL, buff=0.08, stroke_width=2,
                )
                y_rect = SurroundingRectangle(
                    y_cells[c], color=Y_COL, buff=0.08, stroke_width=2,
                )

                self.play(Create(x_rect), Create(y_rect), run_time=0.3)
                self.play(Write(prod_tex), run_time=0.5)
                self.play(FadeOut(x_rect), FadeOut(y_rect), run_time=0.2)
                product_labels.append(prod_tex)
            else:
                q_tex = MathTex(
                    str(self.XS[c]), r"\times", r"?", r"=", r"?",
                    font_size=28,
                )
                q_tex[0].set_color(X_COL)
                q_tex[2].set_color(ERR_COL)
                q_tex[4].set_color(ERR_COL)
                q_tex.move_to(DOWN * 2.2 + RIGHT * (c - 1.5) * 1.8)
                self.play(Write(q_tex), run_time=0.3)
                product_labels.append(q_tex)

        self.wait(0.5)

        # ── Flash "All products = 24!" ───────────────────────────────
        known_prods = VGroup(*[
            product_labels[c] for c in range(4) if self.YS[c] is not None
        ])
        flash_rects = VGroup(*[
            SurroundingRectangle(p, color=K_COL, buff=0.06)
            for p in known_prods
        ])
        all_equal = Text("All products = 24!", font_size=28, color=K_COL)
        all_equal.move_to(DOWN * 3.2)

        self.play(Create(flash_rects), Write(all_equal), run_time=0.8)
        self.wait(1.0)

        # ── Clean up for next scene ──────────────────────────────────
        self.play(
            FadeOut(all_cells), FadeOut(h_lines), FadeOut(v_line),
            *[FadeOut(p) for p in product_labels],
            FadeOut(flash_rects), FadeOut(all_equal),
            run_time=0.6,
        )

    # ──────────────────────────────────────────────────────────────────
    # Scene 2: Rectangle Area Metaphor  (~10s)
    # ──────────────────────────────────────────────────────────────────
    def scene_rectangle_metaphor(self):
        # ── Title equation ────────────────────────────────────────────
        rule = MathTex(r"x", r"\cdot", r"y", r"=", r"k", font_size=52)
        rule[0].set_color(X_COL)
        rule[2].set_color(Y_COL)
        rule[4].set_color(K_COL)
        rule.to_edge(UP, buff=0.6)

        subtitle = Text(
            "The product is always constant",
            font_size=26, color=STRUCT_COL,
        )
        subtitle.next_to(rule, DOWN, buff=0.25)

        self.play(Write(rule), FadeIn(subtitle, shift=UP * 0.2), run_time=1.0)
        self.wait(0.5)

        # ── Animated rectangle with constant area ─────────────────────
        AREA = 4.8  # visual area in Manim units
        width_tracker = ValueTracker(3.0)

        rect = always_redraw(lambda: Rectangle(
            width=width_tracker.get_value(),
            height=AREA / max(width_tracker.get_value(), 0.3),
            color=X_COL, fill_opacity=0.25, fill_color=X_COL,
        ).move_to(DOWN * 0.5))

        width_label = always_redraw(lambda: MathTex(
            r"x=" + f"{width_tracker.get_value():.1f}",
            font_size=26, color=X_COL,
        ).next_to(rect, DOWN, buff=0.15))

        height_label = always_redraw(lambda: MathTex(
            r"y=" + f"{AREA / max(width_tracker.get_value(), 0.3):.1f}",
            font_size=26, color=Y_COL,
        ).next_to(rect, LEFT, buff=0.15))

        area_label = always_redraw(lambda: MathTex(
            r"xy = " + f"{AREA:.1f}",
            font_size=30, color=K_COL,
        ).move_to(rect.get_center()))

        self.play(
            FadeIn(rect), FadeIn(width_label),
            FadeIn(height_label), FadeIn(area_label),
            run_time=0.8,
        )
        self.wait(0.3)

        # ── Width sweep: 3 → 5.5 → 1.5 → 3 ──────────────────────────
        self.play(
            width_tracker.animate.set_value(5.5),
            run_time=1.5, rate_func=smooth,
        )
        self.wait(0.2)
        self.play(
            width_tracker.animate.set_value(1.5),
            run_time=1.5, rate_func=smooth,
        )
        self.wait(0.2)
        self.play(
            width_tracker.animate.set_value(3.0),
            run_time=1.0, rate_func=smooth,
        )
        self.wait(0.5)

        # ── Clean up ─────────────────────────────────────────────────
        self.play(
            FadeOut(rect), FadeOut(width_label),
            FadeOut(height_label), FadeOut(area_label),
            FadeOut(rule), FadeOut(subtitle),
            run_time=0.6,
        )

    # ──────────────────────────────────────────────────────────────────
    # Scene 3: Solve the Missing Value  (~12s)
    # ──────────────────────────────────────────────────────────────────
    def scene_solve_missing(self):
        # ── Title ─────────────────────────────────────────────────────
        solve_title = Text("Find the Missing Value", font_size=40)
        solve_title.to_edge(UP)
        self.play(Write(solve_title), run_time=0.6)
        self.wait(0.3)

        # ── Compact mini-table (left side) ────────────────────────────
        mini_header = VGroup(
            Text("x", font_size=28, color=X_COL),
            Text("y", font_size=28, color=Y_COL),
        ).arrange(RIGHT, buff=2.8)
        mini_header.move_to(LEFT * 3 + UP * 2)

        mini_rows = VGroup()
        for c in range(4):
            x_m = MathTex(str(self.XS[c]), font_size=30, color=X_COL)
            if self.YS[c] is not None:
                y_m = MathTex(str(self.YS[c]), font_size=30, color=Y_COL)
            else:
                y_m = MathTex(r"?", font_size=30, color=ERR_COL)
            row = VGroup(x_m, y_m).arrange(RIGHT, buff=3.0)
            mini_rows.add(row)

        mini_rows.arrange(DOWN, buff=0.35, aligned_edge=LEFT)
        mini_rows.next_to(mini_header, DOWN, buff=0.4)

        mini_table = VGroup(mini_header, mini_rows)
        mini_table.move_to(LEFT * 2.5 + UP * 0.5)

        self.play(FadeIn(mini_table), run_time=0.8)
        self.wait(0.5)

        # ── Step 1: Find k from a known pair ──────────────────────────
        step1_label = Text("Step 1: Find k", font_size=26, color=K_COL)
        step1_label.move_to(RIGHT * 2.5 + UP * 1.8)
        self.play(Write(step1_label), run_time=0.5)

        first_row = mini_rows[0]
        highlight_row = SurroundingRectangle(
            first_row, color=K_COL, buff=0.1, stroke_width=2,
        )
        self.play(Create(highlight_row), run_time=0.4)

        step1_math = MathTex(
            r"k", r"=", r"2", r"\times", r"12", r"=", r"24",
            font_size=32,
        )
        step1_math[0].set_color(K_COL)
        step1_math[2].set_color(X_COL)
        step1_math[4].set_color(Y_COL)
        step1_math[6].set_color(K_COL)
        step1_math.next_to(step1_label, DOWN, buff=0.35)

        self.play(Write(step1_math), run_time=0.7)
        self.wait(0.8)

        # ── Step 2: Solve for missing y ───────────────────────────────
        step2_label = Text("Step 2: Solve for y", font_size=26, color=GOLD_COL)
        step2_label.next_to(step1_math, DOWN, buff=0.5)
        self.play(Write(step2_label), run_time=0.5)

        mystery_row = mini_rows[self.MISSING_IDX]
        highlight_mystery = SurroundingRectangle(
            mystery_row, color=ERR_COL, buff=0.1, stroke_width=2,
        )
        self.play(Create(highlight_mystery), run_time=0.4)

        step2_math = MathTex(
            r"y", r"=", r"\frac{k}{x}",
            r"=", r"\frac{24}{6}",
            font_size=32,
        )
        step2_math[0].set_color(Y_COL)
        step2_math[2].set_color(K_COL)
        step2_math[4].set_color(GOLD_COL)
        step2_math.next_to(step2_label, DOWN, buff=0.35)
        self.play(Write(step2_math), run_time=0.8)
        self.wait(0.4)

        answer_eq = MathTex(r"= 4", font_size=36, color=GOLD_COL)
        answer_eq.next_to(step2_math, RIGHT, buff=0.2)
        self.play(Write(answer_eq), run_time=0.5)
        self.wait(0.5)

        # ── Replace "?" with the answer in the table ──────────────────
        old_q = mystery_row[1]
        answer_cell = MathTex(
            str(self.MISSING_ANSWER), font_size=30, color=GOLD_COL,
        )
        answer_cell.move_to(old_q.get_center())

        self.play(
            ReplacementTransform(old_q, answer_cell),
            FadeOut(highlight_mystery),
            FadeOut(highlight_row),
            run_time=0.6,
        )
        self.wait(0.8)

        # ── Store refs for cleanup ────────────────────────────────────
        self._solve_cleanup = VGroup(
            step1_label, step1_math,
            step2_label, step2_math, answer_eq,
            mini_table, answer_cell,
            solve_title,
        )

    # ──────────────────────────────────────────────────────────────────
    # Scene 4: Boxed Insight  (~4s)
    # ──────────────────────────────────────────────────────────────────
    def scene_insight(self):
        self.play(FadeOut(self._solve_cleanup), run_time=0.6)

        insight_lines = VGroup(
            Text("Key Insight", font_size=30, color=K_COL),
            MathTex(
                r"x \cdot y = k",
                r"\text{ (constant)}",
                font_size=32, color=STRUCT_COL,
            ),
            Text(
                "Find k from any complete pair, then divide.",
                font_size=24, color=GREY_B,
            ),
        ).arrange(DOWN, buff=0.25)
        insight_lines.move_to(ORIGIN)

        insight_box = SurroundingRectangle(
            insight_lines, color=K_COL, buff=0.3, corner_radius=0.1,
        )

        self.play(Write(insight_lines), Create(insight_box), run_time=1.0)
        self.wait(2)
