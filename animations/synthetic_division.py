"""
Synthetic Division: (x^4 + x^3 - 6x^2 - 4x + 8) / (x - 2)

Step-by-step procedural animation for Algebra 2 students.
Shows the full multiply-add cycle with color-coded steps,
grid construction, and Factor Theorem callout.

Run with: manim -qm --format=mp4 synthetic_division.py SyntheticDivision
"""
from manim import *

# 3B1B-style palette
BG_COLOR = "#1C1C1C"
BLUE_COLOR = "#3B82F6"
YELLOW_COLOR = "#FACC15"
GREEN_COLOR = "#22C55E"
ACCENT_COLOR = "#EC4899"
HINT_COLOR = "#94A3B8"


class SyntheticDivision(Scene):
    def construct(self):
        self.camera.background_color = BG_COLOR

        # ==============================================================
        # 1. TITLE  (0-3s)
        # ==============================================================
        title = Text("Synthetic Division", font_size=48, weight=BOLD)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1.0)

        subtitle = Text(
            "The shortcut for (x \u2212 a) divisors",
            font_size=32,
            color=YELLOW_COLOR,
        )
        subtitle.next_to(title, DOWN, buff=0.3)
        self.play(FadeIn(subtitle, shift=UP * 0.2), run_time=0.8)
        self.wait(0.8)
        self.play(FadeOut(subtitle), run_time=0.5)

        # ==============================================================
        # 2. SETUP  (3-8s)
        # ==============================================================
        poly_label = Text("Dividend:", font_size=26, color=HINT_COLOR)
        poly_label.next_to(title, DOWN, buff=0.5).to_edge(LEFT, buff=1.0)

        poly = MathTex(
            "P(x)", "=", "x^4", "+", "x^3", "-", "6x^2", "-", "4x", "+", "8",
            font_size=38,
        )
        poly.set_color(ManimColor(BLUE_COLOR))
        poly.next_to(poly_label, DOWN, buff=0.3, aligned_edge=LEFT)

        div_label = Text("Divisor:", font_size=26, color=HINT_COLOR)
        div_label.next_to(poly, DOWN, buff=0.5, aligned_edge=LEFT)

        divisor = MathTex("(x - 2)", font_size=38, color=YELLOW_COLOR)
        divisor.next_to(div_label, RIGHT, buff=0.3)

        self.play(Write(poly_label), run_time=0.5)
        self.play(Write(poly), run_time=1.0)
        self.wait(0.4)
        self.play(Write(div_label), Write(divisor), run_time=0.8)
        self.wait(0.6)

        # Extract a = 2 with arrow and box
        insight_line1 = MathTex(
            "(x - 2)", "\\Rightarrow", "a", "=", "2",
            font_size=36,
        )
        insight_line1[0].set_color(YELLOW_COLOR)
        insight_line1[2].set_color(YELLOW_COLOR)
        insight_line1[4].set_color(YELLOW_COLOR)
        insight_line1.move_to(RIGHT * 2.5 + DOWN * 1.0)

        arrow = Arrow(
            divisor.get_right() + RIGHT * 0.1,
            insight_line1.get_left() + LEFT * 0.1,
            color=YELLOW_COLOR,
            buff=0.15,
        )

        self.play(GrowArrow(arrow), run_time=0.5)
        self.play(Write(insight_line1), run_time=0.8)

        a_box = SurroundingRectangle(
            insight_line1[2:], color=YELLOW_COLOR, buff=0.12
        )
        self.play(Create(a_box), run_time=0.5)
        self.wait(0.6)

        # ==============================================================
        # 3. COEFFICIENT EXTRACTION  (8-12s)
        # ==============================================================
        # Clear setup
        self.play(
            FadeOut(poly_label), FadeOut(div_label), FadeOut(divisor),
            FadeOut(arrow), FadeOut(insight_line1), FadeOut(a_box),
            poly.animate.next_to(title, DOWN, buff=0.4),
            run_time=0.7,
        )

        coeff_label = Text(
            "Write only the coefficients:", font_size=26, color=HINT_COLOR
        )
        coeff_label.next_to(poly, DOWN, buff=0.4)
        self.play(Write(coeff_label), run_time=0.6)

        # Show coefficient extraction with highlights
        coeffs = [1, 1, -6, -4, 8]
        coeff_strs = ["1", "1", "-6", "-4", "8"]
        # Indices into poly MathTex: x^4=2, x^3=4, 6x^2=6, 4x=8, 8=10
        term_indices = [2, 4, 6, 8, 10]

        coeff_mobjects = []
        for i, cs in enumerate(coeff_strs):
            c = MathTex(cs, font_size=38)
            coeff_mobjects.append(c)

        coeff_row = VGroup(*coeff_mobjects).arrange(RIGHT, buff=0.7)
        coeff_row.next_to(coeff_label, DOWN, buff=0.4)

        # Animate each coefficient appearing, highlight the source term
        for i, (c_mob, t_idx) in enumerate(zip(coeff_mobjects, term_indices)):
            # Highlight source term
            self.play(
                poly[t_idx].animate.set_color(YELLOW_COLOR),
                Write(c_mob),
                run_time=0.5,
            )
        self.wait(0.4)

        # Reset poly colors
        self.play(
            poly.animate.set_color(ManimColor(BLUE_COLOR)),
            run_time=0.3,
        )

        # ==============================================================
        # 4. BUILD THE GRID  (12-16s)
        # ==============================================================
        # Clear the polynomial and label
        self.play(
            FadeOut(poly), FadeOut(title), FadeOut(coeff_label),
            run_time=0.5,
        )

        # --- Grid layout ---
        # Position the grid centered on screen, shifted up slightly
        grid_origin = UP * 1.8 + LEFT * 1.5

        # Column spacing
        col_w = 1.1
        num_cols = 5  # 5 coefficients

        # The a=2 value on the left
        a_val = MathTex("2", font_size=38, color=YELLOW_COLOR)
        a_val.move_to(grid_origin + LEFT * 1.4)

        # Coefficient row across the top
        top_row = []
        for i, c_mob in enumerate(coeff_mobjects):
            target_pos = grid_origin + RIGHT * (i * col_w)
            c_mob.move_to(target_pos)
            top_row.append(c_mob)

        top_group = VGroup(*top_row)

        # Animate coefficients moving into grid position
        self.play(
            *[c.animate.move_to(grid_origin + RIGHT * (i * col_w))
              for i, c in enumerate(coeff_mobjects)],
            FadeIn(a_val),
            run_time=0.8,
        )

        # Horizontal divider line
        line_left = grid_origin + LEFT * 0.5 + DOWN * 0.45
        line_right = grid_origin + RIGHT * ((num_cols - 1) * col_w + 0.5) + DOWN * 0.45
        h_line = Line(line_left, line_right, stroke_width=2.5)

        # Vertical separator between a and coefficients
        v_sep_top = a_val.get_right() + RIGHT * 0.35 + UP * 0.5
        v_sep_bottom = a_val.get_right() + RIGHT * 0.35 + DOWN * 0.75
        v_line = Line(v_sep_top, v_sep_bottom, stroke_width=2.5)

        self.play(Create(h_line), Create(v_line), run_time=0.6)
        self.wait(0.3)

        # Label the rows
        mult_label = Text("multiply", font_size=18, color=HINT_COLOR)
        mult_label.next_to(h_line, UP, buff=0.05).to_edge(RIGHT, buff=0.5)

        result_label = Text("result", font_size=18, color=HINT_COLOR)
        result_label.next_to(h_line, DOWN, buff=0.05).to_edge(RIGHT, buff=0.5)

        self.play(FadeIn(mult_label), FadeIn(result_label), run_time=0.4)
        self.wait(0.3)

        # Positions for multiply row (above line) and result row (below line)
        def mult_pos(col):
            return grid_origin + RIGHT * (col * col_w) + DOWN * 0.15

        def result_pos(col):
            return grid_origin + RIGHT * (col * col_w) + DOWN * 0.85

        # ==============================================================
        # 5. ANIMATE MULTIPLY-ADD CYCLES  (16-35s)
        # ==============================================================
        result_values = []  # will hold the MathTex objects in result row
        result_nums = []    # numeric values

        # --- Bring down first coefficient (BLUE) ---
        step_note = Text("Bring down the first coefficient", font_size=24, color=BLUE_COLOR)
        step_note.to_edge(DOWN, buff=0.5)
        self.play(FadeIn(step_note, shift=UP * 0.1), run_time=0.4)

        r0 = MathTex("1", font_size=38, color=BLUE_COLOR)
        r0.move_to(result_pos(0))

        # Arrow from top row down
        bd_arrow = Arrow(
            coeff_mobjects[0].get_bottom() + DOWN * 0.05,
            result_pos(0) + UP * 0.25,
            color=ManimColor(BLUE_COLOR),
            buff=0.05,
            stroke_width=2.5,
            tip_length=0.15,
        )
        self.play(GrowArrow(bd_arrow), run_time=0.4)
        self.play(Write(r0), run_time=0.4)
        result_values.append(r0)
        result_nums.append(1)
        self.wait(0.3)
        self.play(FadeOut(bd_arrow), FadeOut(step_note), run_time=0.3)

        # --- Cycles 1-4 ---
        cycle_data = [
            # (col, prev_result, a, product, coeff, sum_val, is_last)
            (1, 1, 2, 2, 1, 3, False),
            (2, 3, 2, 6, -6, 0, False),
            (3, 0, 2, 0, -4, -4, False),
            (4, -4, 2, -8, 8, 0, True),
        ]

        for col, prev_r, a, prod, coeff, sumv, is_last in cycle_data:
            cycle_color = GREEN_COLOR if is_last else YELLOW_COLOR

            # Step info at bottom
            if is_last:
                info_text = Text("Final cycle", font_size=24, color=cycle_color)
            else:
                info_text = Text(f"Cycle {col}", font_size=24, color=cycle_color)
            info_text.to_edge(DOWN, buff=0.5)

            # Multiply sub-info
            mult_text = MathTex(
                f"{prev_r}" + r"\times" + f"{a}" + "=" + f"{prod}",
                font_size=28, color=cycle_color,
            )
            mult_text.next_to(info_text, UP, buff=0.2)

            self.play(FadeIn(info_text, shift=UP * 0.1), run_time=0.3)

            # Show multiply arrow from previous result to multiply row
            mult_arrow = CurvedArrow(
                result_pos(col - 1) + RIGHT * 0.3,
                mult_pos(col) + LEFT * 0.3 + DOWN * 0.15,
                angle=-TAU / 6,
                color=ManimColor(cycle_color),
                stroke_width=2.5,
                tip_length=0.15,
            )
            self.play(Create(mult_arrow), run_time=0.4)

            # Write product in multiply row
            prod_str = str(prod)
            prod_mob = MathTex(prod_str, font_size=38, color=cycle_color)
            prod_mob.move_to(mult_pos(col))

            self.play(Write(prod_mob), FadeIn(mult_text, shift=UP * 0.1), run_time=0.5)
            self.wait(0.2)

            # Show addition
            add_text = MathTex(
                f"{coeff}" + "+" + f"({prod})" + "=" + f"{sumv}",
                font_size=28, color=cycle_color,
            )
            add_text.next_to(info_text, UP, buff=0.2)

            self.play(
                ReplacementTransform(mult_text, add_text),
                FadeOut(mult_arrow),
                run_time=0.4,
            )

            # Write sum in result row
            sum_str = str(sumv)
            sum_mob = MathTex(sum_str, font_size=38, color=cycle_color)
            sum_mob.move_to(result_pos(col))

            self.play(Write(sum_mob), run_time=0.5)
            result_values.append(sum_mob)
            result_nums.append(sumv)
            self.wait(0.3)

            self.play(FadeOut(info_text), FadeOut(add_text), run_time=0.3)

        self.wait(0.3)

        # ==============================================================
        # 6. READ THE RESULT  (35-42s)
        # ==============================================================
        # Fade row labels
        self.play(FadeOut(mult_label), FadeOut(result_label), run_time=0.3)

        # Draw vertical separator before the last result (remainder)
        sep_x = (result_pos(3)[0] + result_pos(4)[0]) / 2
        sep_top = result_pos(4) + UP * 0.35
        sep_bottom = result_pos(4) + DOWN * 0.35
        remainder_sep = Line(
            [sep_x, sep_top[1], 0],
            [sep_x, sep_bottom[1], 0],
            stroke_width=2.5,
            color=ManimColor(ACCENT_COLOR),
        )
        self.play(Create(remainder_sep), run_time=0.4)

        # Label quotient coefficients and remainder
        q_label = Text("Quotient coefficients", font_size=22, color=BLUE_COLOR)
        q_label.next_to(
            VGroup(*result_values[:4]), DOWN, buff=0.35
        )

        r_label = Text("Remainder", font_size=22, color=ACCENT_COLOR)
        r_label.next_to(result_values[4], DOWN, buff=0.35)

        self.play(FadeIn(q_label), FadeIn(r_label), run_time=0.5)
        self.wait(0.5)

        # Show the quotient polynomial
        quotient_text = MathTex(
            r"Q(x) = x^3 + 3x^2 + 0x - 4 = x^3 + 3x^2 - 4",
            font_size=34,
        )
        quotient_text.to_edge(DOWN, buff=0.7)

        q_box = SurroundingRectangle(
            quotient_text, color=ManimColor(BLUE_COLOR), buff=0.15
        )
        self.play(Write(quotient_text), Create(q_box), run_time=1.0)
        self.wait(1.0)

        # ==============================================================
        # 7. FACTOR THEOREM CALLOUT  (42-47s)
        # ==============================================================
        self.play(FadeOut(q_label), FadeOut(r_label), run_time=0.3)

        factor_text = Text(
            "Remainder = 0  \u2192  (x \u2212 2) is a factor!",
            font_size=32,
            color=GREEN_COLOR,
        )
        factor_text.next_to(quotient_text, UP, buff=0.6)

        factor_box = SurroundingRectangle(
            factor_text, color=ManimColor(GREEN_COLOR), buff=0.15, corner_radius=0.1,
        )

        self.play(
            FadeIn(factor_text, shift=UP * 0.2),
            Create(factor_box),
            run_time=0.8,
        )
        self.wait(1.0)

        # Show the full factored form
        factored = MathTex(
            r"x^4 + x^3 - 6x^2 - 4x + 8",
            r"=",
            r"(x - 2)",
            r"(x^3 + 3x^2 - 4)",
            font_size=30,
        )
        factored[2].set_color(YELLOW_COLOR)
        factored[3].set_color(ManimColor(BLUE_COLOR))
        factored.next_to(factor_box, DOWN, buff=0.3)

        # Shift things up to make room
        grid_group = VGroup(
            a_val, *coeff_mobjects, h_line, v_line,
            *result_values, remainder_sep,
            # include the product mobjects that are on screen
        )
        self.play(
            grid_group.animate.shift(UP * 0.5),
            factor_text.animate.shift(UP * 0.3),
            factor_box.animate.shift(UP * 0.3),
            run_time=0.5,
        )
        factored.next_to(factor_box, DOWN, buff=0.25)
        self.play(Write(factored), run_time=1.0)
        self.wait(1.0)

        # ==============================================================
        # 8. KEY INSIGHT  (47-52s)
        # ==============================================================
        # Fade most elements
        self.play(
            FadeOut(grid_group),
            FadeOut(factor_text), FadeOut(factor_box),
            FadeOut(factored),
            FadeOut(quotient_text), FadeOut(q_box),
            run_time=0.6,
        )

        key_insight = Text(
            "Synthetic division only works when the divisor is (x \u2212 a)",
            font_size=30,
            color=YELLOW_COLOR,
        )
        key_insight.move_to(ORIGIN)
        key_box = SurroundingRectangle(
            key_insight, color=YELLOW_COLOR, buff=0.2, corner_radius=0.1,
        )

        self.play(
            FadeIn(key_insight, shift=UP * 0.2),
            Create(key_box),
            run_time=0.8,
        )
        self.wait(2.5)
