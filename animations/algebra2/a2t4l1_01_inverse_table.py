"""
Level 1: Inverse Variation — Finding a Missing Table Value
Shows how xy = k (constant) lets you find any missing value in an
inverse-variation table.

Run with: python -m manim -qm --format=mp4 a2t4l1_01_inverse_table.py InverseTableScene
"""
from manim import *


class InverseTableScene(Scene):
    def construct(self):
        # ── Concrete data (matches generator bank item 2) ──────────────
        xs = [2, 3, 4, 6]
        ys = [12, 8, 6, None]          # None = the mystery value
        K = 24                          # constant product
        missing_idx = 3                 # index of the "?" cell
        missing_answer = 4             # K / xs[missing_idx]

        # ── Colors ─────────────────────────────────────────────────────
        X_COL = BLUE
        Y_COL = YELLOW
        K_COL = GREEN
        HIGHLIGHT = RED

        # ============================================================
        # SCENE 1 — The table and constant-product reveal
        # ============================================================
        title = Text("Inverse Variation Table", font_size=44)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Build the table as a grid of MathTex entries
        col_labels = [
            Text("x", font_size=30, color=X_COL),
            Text("y", font_size=30, color=Y_COL),
            MathTex(r"x \cdot y", font_size=30, color=K_COL),
        ]
        n_cols = len(xs)

        # x-row values
        x_cells = [MathTex(str(x), font_size=32, color=X_COL) for x in xs]
        # y-row values (use "?" for missing)
        y_cells = []
        for y in ys:
            if y is None:
                y_cells.append(MathTex(r"?", font_size=32, color=HIGHLIGHT))
            else:
                y_cells.append(MathTex(str(y), font_size=32, color=Y_COL))

        # product-row (blank at first, will be filled in)
        prod_cells = [Text("", font_size=32) for _ in xs]

        # Arrange into a VGroup grid
        CELL_W = 1.4
        ROW_H = 0.7
        table_group = VGroup()

        def cell_pos(row, col):
            return RIGHT * (col * CELL_W) + DOWN * (row * ROW_H)

        # Place labels
        for r, label in enumerate(col_labels):
            label.move_to(cell_pos(r, -1))
            table_group.add(label)

        for c in range(n_cols):
            x_cells[c].move_to(cell_pos(0, c))
            y_cells[c].move_to(cell_pos(1, c))
            prod_cells[c].move_to(cell_pos(2, c))
            table_group.add(x_cells[c], y_cells[c], prod_cells[c])

        # Center the whole table
        table_group.move_to(ORIGIN + UP * 0.3)

        # Draw horizontal separator lines
        left_edge = cell_pos(0, -1.5)[0]
        right_edge = cell_pos(0, n_cols - 0.5)[0]
        h_lines = VGroup()
        for r in range(3):
            y_pos = (cell_pos(r, 0)[1] + cell_pos(r - 1, 0)[1]) / 2 if r > 0 else cell_pos(0, 0)[1] + ROW_H * 0.5
            if r > 0:
                y_pos = (cell_pos(r, 0)[1] + cell_pos(r - 1, 0)[1]) / 2
            else:
                y_pos = cell_pos(0, 0)[1] + ROW_H * 0.5
            line = Line(
                start=LEFT * abs(left_edge) + UP * y_pos,
                end=RIGHT * abs(right_edge) + UP * y_pos,
                color=GREY, stroke_width=1
            )
            h_lines.add(line)
        # Bottom line
        bot_y = cell_pos(2, 0)[1] - ROW_H * 0.5
        h_lines.add(Line(
            start=LEFT * abs(left_edge) + UP * bot_y,
            end=RIGHT * abs(right_edge) + UP * bot_y,
            color=GREY, stroke_width=1
        ))

        # Vertical separator after labels
        v_line_x = (cell_pos(0, -1)[0] + cell_pos(0, 0)[0]) / 2
        v_line = Line(
            start=v_line_x * RIGHT + UP * (cell_pos(0, 0)[1] + ROW_H * 0.5),
            end=v_line_x * RIGHT + UP * bot_y,
            color=GREY, stroke_width=1
        )

        # Animate table appearance (no product row yet)
        self.play(
            *[FadeIn(mob) for mob in [*col_labels[:2], *x_cells, *y_cells]],
            *[Create(l) for l in h_lines[:3]],  # top 3 lines
            Create(v_line),
            run_time=1.2
        )
        self.wait(0.8)

        # Reveal the product label and row header
        self.play(FadeIn(col_labels[2]), Create(h_lines[3]), run_time=0.6)
        self.wait(0.3)

        # Animate each known product appearing one by one
        for c in range(n_cols):
            if ys[c] is not None:
                product_val = xs[c] * ys[c]
                new_prod = MathTex(str(product_val), font_size=32, color=K_COL)
                new_prod.move_to(prod_cells[c].get_center())

                # Brief highlight on the x and y cells
                x_rect = SurroundingRectangle(x_cells[c], color=X_COL, buff=0.08, stroke_width=2)
                y_rect = SurroundingRectangle(y_cells[c], color=Y_COL, buff=0.08, stroke_width=2)

                self.play(Create(x_rect), Create(y_rect), run_time=0.3)
                self.play(
                    ReplacementTransform(prod_cells[c], new_prod),
                    run_time=0.4
                )
                prod_cells[c] = new_prod
                self.play(FadeOut(x_rect), FadeOut(y_rect), run_time=0.2)
            else:
                # Missing column — show "?" in product row too
                q_prod = MathTex(r"?", font_size=32, color=HIGHLIGHT)
                q_prod.move_to(prod_cells[c].get_center())
                self.play(ReplacementTransform(prod_cells[c], q_prod), run_time=0.3)
                prod_cells[c] = q_prod

        self.wait(0.5)

        # Flash the constant pattern — all products are the same!
        same_label = Text("All equal 24!", font_size=28, color=K_COL)
        same_label.next_to(table_group, RIGHT, buff=0.6)
        constant_rects = VGroup(*[
            SurroundingRectangle(prod_cells[c], color=K_COL, buff=0.06)
            for c in range(n_cols) if ys[c] is not None
        ])
        self.play(Create(constant_rects), Write(same_label), run_time=0.8)
        self.wait(1.0)

        # ============================================================
        # SCENE 2 — The rule + rectangle area metaphor
        # ============================================================
        self.play(
            FadeOut(table_group), FadeOut(h_lines), FadeOut(v_line),
            FadeOut(constant_rects), FadeOut(same_label),
            FadeOut(title),
            run_time=0.8
        )

        rule = MathTex(r"x \cdot y = k", font_size=52, color=K_COL)
        rule_subtitle = Text("The product is always constant", font_size=26, color=WHITE)
        rule_group = VGroup(rule, rule_subtitle).arrange(DOWN, buff=0.25)
        rule_group.to_edge(UP, buff=0.6)
        self.play(Write(rule), FadeIn(rule_subtitle, shift=UP * 0.2), run_time=1.0)
        self.wait(0.8)

        # Animated rectangle whose area = 24 stays constant
        AREA = 4.8          # visual area in Manim units (scaled for display)
        init_w = 3.0        # initial width
        init_h = AREA / init_w

        width_tracker = ValueTracker(init_w)

        rect = always_redraw(lambda: Rectangle(
            width=width_tracker.get_value(),
            height=AREA / width_tracker.get_value(),
            color=BLUE, fill_opacity=0.25, fill_color=BLUE
        ).move_to(DOWN * 0.5))

        width_label = always_redraw(lambda: MathTex(
            r"x=" + f"{width_tracker.get_value():.1f}",
            font_size=26, color=X_COL
        ).next_to(rect, DOWN, buff=0.15))

        height_label = always_redraw(lambda: MathTex(
            r"y=" + f"{AREA / width_tracker.get_value():.1f}",
            font_size=26, color=Y_COL
        ).next_to(rect, LEFT, buff=0.15))

        area_label = always_redraw(lambda: MathTex(
            r"xy = " + f"{AREA:.1f}",
            font_size=30, color=K_COL
        ).move_to(rect.get_center()))

        self.play(
            FadeIn(rect), FadeIn(width_label),
            FadeIn(height_label), FadeIn(area_label),
            run_time=0.8
        )
        self.wait(0.5)

        # Animate width growing → height shrinks, area unchanged
        self.play(width_tracker.animate.set_value(5.5), run_time=1.5, rate_func=smooth)
        self.wait(0.3)
        self.play(width_tracker.animate.set_value(1.5), run_time=1.5, rate_func=smooth)
        self.wait(0.3)
        self.play(width_tracker.animate.set_value(3.0), run_time=1.0, rate_func=smooth)
        self.wait(0.8)

        # ============================================================
        # SCENE 3 — Solve for the missing value
        # ============================================================
        self.play(
            FadeOut(rect), FadeOut(width_label),
            FadeOut(height_label), FadeOut(area_label),
            FadeOut(rule), FadeOut(rule_subtitle),
            run_time=0.6
        )

        solve_title = Text("Find the Missing Value", font_size=40)
        solve_title.to_edge(UP)
        self.play(Write(solve_title))
        self.wait(0.3)

        # Rebuild a compact version of the table for the solve walkthrough
        mini_header = VGroup(
            Text("x", font_size=28, color=X_COL),
            Text("y", font_size=28, color=Y_COL),
        ).arrange(RIGHT, buff=2.8)
        mini_header.shift(UP * 2)

        mini_rows = VGroup()
        for c in range(n_cols):
            x_m = MathTex(str(xs[c]), font_size=30, color=X_COL)
            if ys[c] is not None:
                y_m = MathTex(str(ys[c]), font_size=30, color=Y_COL)
            else:
                y_m = MathTex(r"?", font_size=30, color=HIGHLIGHT)
            row = VGroup(x_m, y_m).arrange(RIGHT, buff=3.0)
            mini_rows.add(row)

        mini_rows.arrange(DOWN, buff=0.35, aligned_edge=LEFT)
        mini_rows.next_to(mini_header, DOWN, buff=0.4)

        mini_table = VGroup(mini_header, mini_rows)
        mini_table.shift(LEFT * 2.5)

        self.play(FadeIn(mini_table), run_time=0.8)
        self.wait(0.5)

        # Step 1: Find k from a known pair — highlight first row
        step1_label = Text("Step 1: Find k", font_size=26, color=K_COL)
        step1_label.move_to(RIGHT * 2.5 + UP * 1.8)
        self.play(Write(step1_label), run_time=0.5)

        first_row = mini_rows[0]
        highlight_row = SurroundingRectangle(first_row, color=K_COL, buff=0.08)
        self.play(Create(highlight_row), run_time=0.4)

        step1_math = MathTex(
            r"k = 2 \times 12 = 24",
            font_size=32, color=K_COL
        )
        step1_math.next_to(step1_label, DOWN, buff=0.35)
        self.play(Write(step1_math), run_time=0.7)
        self.wait(0.8)

        # Step 2: Solve for missing y
        step2_label = Text("Step 2: Solve for y", font_size=26, color=HIGHLIGHT)
        step2_label.next_to(step1_math, DOWN, buff=0.5)
        self.play(Write(step2_label), run_time=0.5)

        # Highlight the mystery row
        mystery_row = mini_rows[missing_idx]
        highlight_mystery = SurroundingRectangle(mystery_row, color=HIGHLIGHT, buff=0.08)
        self.play(Create(highlight_mystery), run_time=0.4)

        step2_math = VGroup(
            MathTex(r"y = \frac{k}{x} = \frac{24}{6}", font_size=32),
            MathTex(r"= 4", font_size=36, color=K_COL),
        ).arrange(RIGHT, buff=0.2)
        step2_math.next_to(step2_label, DOWN, buff=0.35)
        self.play(Write(step2_math), run_time=0.8)
        self.wait(0.5)

        # Replace the "?" with the answer
        answer_tex = MathTex(str(missing_answer), font_size=30, color=K_COL)
        old_q = mystery_row[1]
        answer_tex.move_to(old_q.get_center())
        self.play(
            ReplacementTransform(old_q, answer_tex),
            FadeOut(highlight_mystery),
            FadeOut(highlight_row),
            run_time=0.6
        )
        self.wait(0.8)

        # ── Boxed key insight ──────────────────────────────────────────
        self.play(
            FadeOut(step1_label), FadeOut(step1_math),
            FadeOut(step2_label), FadeOut(step2_math),
            FadeOut(mini_table), FadeOut(answer_tex),
            FadeOut(solve_title),
            run_time=0.6
        )

        insight_lines = VGroup(
            Text("Key Insight", font_size=30, color=K_COL),
            MathTex(
                r"\text{In inverse variation, } x \cdot y = k \text{ (constant)}",
                font_size=32, color=WHITE
            ),
            Text("Find k from any complete pair, then divide.", font_size=24, color=GREY_B),
        ).arrange(DOWN, buff=0.25)
        insight_lines.move_to(ORIGIN)

        insight_box = SurroundingRectangle(insight_lines, color=K_COL, buff=0.3, corner_radius=0.1)
        self.play(Write(insight_lines), Create(insight_box), run_time=1.0)
        self.wait(2)
