"""
Level 2: Equation from a Table (Inverse Variation, A2 Unit 4 Lesson 1)

Given a table of (x, y) pairs, verify xy = constant (inverse variation),
derive y = k/x, graph the hyperbola, and eliminate wrong candidates.

Run with: manim -qm --format=mp4 a2t4l1_02_equation_from_table.py EquationFromTableScene
"""
from manim import *
import numpy as np


class EquationFromTableScene(Scene):
    def construct(self):
        # Data
        x_vals = [2, 4, 6, 12]
        y_vals = [12, 6, 4, 2]
        k = 24

        # ============================================================
        # SCENE 1: Table and constant-product discovery
        # ============================================================
        title = Text("Equation from a Table", font_size=42)
        title.to_edge(UP, buff=0.35)
        self.play(Write(title))
        self.wait(0.3)

        # --- Build the table ---
        header_x = MathTex(r"x", font_size=36, color=BLUE)
        header_y = MathTex(r"y", font_size=36, color=YELLOW)
        header_prod = MathTex(r"x \cdot y", font_size=32, color=GRAY)

        rows_x = [MathTex(str(v), font_size=34, color=BLUE) for v in x_vals]
        rows_y = [MathTex(str(v), font_size=34, color=YELLOW) for v in y_vals]
        rows_prod = [MathTex(str(x_vals[i] * y_vals[i]), font_size=34, color=GREEN)
                     for i in range(len(x_vals))]

        col_buff = 1.2
        row_buff = 0.55

        # Position headers
        header_x.move_to(LEFT * col_buff + UP * 1.5)
        header_y.move_to(UP * 1.5)
        header_prod.move_to(RIGHT * col_buff + UP * 1.5)

        for i in range(len(x_vals)):
            y_pos = UP * (1.5 - (i + 1) * row_buff)
            rows_x[i].move_to(LEFT * col_buff + y_pos)
            rows_y[i].move_to(y_pos)
            rows_prod[i].move_to(RIGHT * col_buff + y_pos)

        # Draw header line
        h_line = Line(
            LEFT * (col_buff + 0.6) + UP * 1.2,
            RIGHT * (col_buff + 0.6) + UP * 1.2,
            color=WHITE, stroke_width=1.5
        )

        # Animate table appearance
        self.play(
            Write(header_x), Write(header_y),
            Create(h_line),
            run_time=0.6
        )
        for i in range(len(x_vals)):
            self.play(Write(rows_x[i]), Write(rows_y[i]), run_time=0.35)
        self.wait(0.3)

        # Reveal the product column
        self.play(Write(header_prod), run_time=0.4)
        for i in range(len(x_vals)):
            # Flash the multiplication
            mult_expr = MathTex(
                str(x_vals[i]), r"\times", str(y_vals[i]), r"=", str(k),
                font_size=30
            )
            mult_expr[0].set_color(BLUE)
            mult_expr[2].set_color(YELLOW)
            mult_expr[4].set_color(GREEN)
            mult_expr.next_to(rows_prod[i], RIGHT, buff=0.6)

            self.play(Write(mult_expr), run_time=0.35)
            self.play(Write(rows_prod[i]), FadeOut(mult_expr), run_time=0.35)

        self.wait(0.3)

        # Flash "k = 24"
        k_label = MathTex(r"k = 24", font_size=48, color=GREEN)
        k_label.shift(DOWN * 1.6)
        k_box = SurroundingRectangle(k_label, color=GREEN, buff=0.15, stroke_width=2.5)

        self.play(Write(k_label), Create(k_box), run_time=0.7)
        self.play(Flash(k_label, color=GREEN, flash_radius=0.6))
        self.wait(0.5)

        # Takeaway
        takeaway1 = Text(
            "Every pair multiplies to the same constant!",
            font_size=22, color=GRAY
        )
        takeaway1.to_edge(DOWN, buff=0.4)
        self.play(Write(takeaway1), run_time=0.6)
        self.wait(0.6)

        # ============================================================
        # SCENE 2: Algebraic rearrangement  xy = 24  -->  y = 24/x
        # ============================================================
        # Fade out Scene 1
        scene1_objs = VGroup(
            header_x, header_y, header_prod, h_line,
            *rows_x, *rows_y, *rows_prod,
            k_label, k_box, takeaway1
        )
        self.play(FadeOut(scene1_objs), run_time=0.6)

        subtitle2 = Text("From constant product to equation", font_size=30, color=GREEN)
        subtitle2.next_to(title, DOWN, buff=0.25)
        self.play(Write(subtitle2), run_time=0.5)

        # Step 1: xy = 24
        step1 = MathTex(r"x", r"\cdot", r"y", r"=", r"24", font_size=48)
        step1[0].set_color(BLUE)
        step1[2].set_color(YELLOW)
        step1[4].set_color(GREEN)
        step1.shift(UP * 0.8)
        self.play(Write(step1), run_time=0.7)
        self.wait(0.4)

        # Step 2: Divide both sides by x
        div_label = MathTex(
            r"\div\, x", font_size=36, color=BLUE
        )
        div_label_left = div_label.copy()
        div_label_right = div_label.copy()

        # Position "divide by x" indicators on both sides
        div_label_left.next_to(step1[1], DOWN, buff=0.5)
        div_label_right.next_to(step1[3], DOWN, buff=0.5)

        self.play(Write(div_label_left), Write(div_label_right), run_time=0.5)
        self.wait(0.3)

        # Step 3: y = 24 / x
        step2 = MathTex(r"y", r"=", r"\frac{24}{x}", font_size=52)
        step2[0].set_color(YELLOW)
        step2[2].set_color(GREEN)
        step2.shift(DOWN * 0.7)

        self.play(
            FadeOut(div_label_left), FadeOut(div_label_right),
            Write(step2),
            run_time=0.8
        )
        self.wait(0.3)

        # Box the equation
        eq_box = SurroundingRectangle(step2, color=GREEN, buff=0.15, stroke_width=2.5)
        self.play(Create(eq_box), run_time=0.4)
        self.wait(0.6)

        # ============================================================
        # SCENE 3: Plot the hyperbola and table points
        # ============================================================
        scene2_objs = VGroup(subtitle2, step1, step2, eq_box)
        self.play(FadeOut(scene2_objs), run_time=0.5)

        subtitle3 = Text("Graph of y = 24/x", font_size=30, color=GREEN)
        subtitle3.next_to(title, DOWN, buff=0.25)
        self.play(Write(subtitle3), run_time=0.5)

        # Create axes
        axes = Axes(
            x_range=[0, 15, 2],
            y_range=[0, 15, 2],
            x_length=5.5,
            y_length=5.0,
            axis_config={
                "include_tip": True,
                "tip_length": 0.2,
                "include_numbers": True,
                "font_size": 22,
            },
        )
        axes.shift(DOWN * 0.3)

        x_label = axes.get_x_axis_label(r"x", direction=RIGHT * 0.5)
        y_label = axes.get_y_axis_label(r"y", direction=UP * 0.5)

        self.play(Create(axes), Write(x_label), Write(y_label), run_time=0.8)
        self.wait(0.3)

        # Plot the hyperbola y = 24/x for x > 0
        hyperbola = axes.plot(
            lambda x: 24 / x,
            x_range=[1.7, 14, 0.05],
            color=GREEN,
            stroke_width=3,
        )
        hyperbola_label = MathTex(r"y = \frac{24}{x}", font_size=28, color=GREEN)
        hyperbola_label.next_to(axes.c2p(8, 3), UP + RIGHT, buff=0.15)

        self.play(Create(hyperbola), Write(hyperbola_label), run_time=1.0)
        self.wait(0.3)

        # Plot each table point
        dots = VGroup()
        dot_labels = VGroup()
        for xv, yv in zip(x_vals, y_vals):
            dot = Dot(axes.c2p(xv, yv), radius=0.08, color=YELLOW)
            label = MathTex(
                r"(" + str(xv) + r",\," + str(yv) + r")",
                font_size=22, color=YELLOW
            )
            label.next_to(dot, UR, buff=0.1)
            dots.add(dot)
            dot_labels.add(label)

        for dot, label in zip(dots, dot_labels):
            self.play(FadeIn(dot, scale=1.5), Write(label), run_time=0.35)

        self.wait(0.3)

        confirm = Text("All points land on the curve!", font_size=22, color=GRAY)
        confirm.to_edge(DOWN, buff=0.35)
        self.play(Write(confirm), run_time=0.5)
        self.wait(0.6)

        # ============================================================
        # SCENE 4: Four candidates -- eliminate wrong ones
        # ============================================================
        scene3_objs = VGroup(
            subtitle3, axes, x_label, y_label,
            hyperbola, hyperbola_label, dots, dot_labels, confirm
        )
        self.play(FadeOut(scene3_objs), run_time=0.5)

        subtitle4 = Text("Which equation fits the table?", font_size=30, color=YELLOW)
        subtitle4.next_to(title, DOWN, buff=0.25)
        self.play(Write(subtitle4), run_time=0.5)

        # Four candidates
        opt_a = MathTex(r"\text{A)}\quad y = \frac{24}{x}", font_size=38)
        opt_b = MathTex(r"\text{B)}\quad y = \frac{x}{24}", font_size=38)
        opt_c = MathTex(r"\text{C)}\quad y = -\frac{24}{x}", font_size=38)
        opt_d = MathTex(r"\text{D)}\quad y = 24x", font_size=38)

        options = VGroup(opt_a, opt_b, opt_c, opt_d).arrange(DOWN, buff=0.55)
        options.shift(LEFT * 2.5 + DOWN * 0.2)

        self.play(*[Write(o) for o in options], run_time=0.8)
        self.wait(0.5)

        # --- Test option B with x = 2 ---
        test_header = Text("Test x = 2:", font_size=24, color=BLUE)
        test_header.shift(RIGHT * 2.5 + UP * 1.0)
        self.play(Write(test_header), run_time=0.4)

        # Highlight option B
        b_rect = SurroundingRectangle(opt_b, color=YELLOW, buff=0.08)
        self.play(Create(b_rect), run_time=0.3)

        test_b = MathTex(
            r"y = \frac{2}{24} = \frac{1}{12}", r"\neq 12",
            font_size=32
        )
        test_b[1].set_color(RED)
        test_b.shift(RIGHT * 2.5 + UP * 0.3)
        self.play(Write(test_b), run_time=0.6)
        self.wait(0.3)

        # Cross out B
        cross_b = Cross(opt_b, stroke_color=RED, stroke_width=3)
        self.play(Create(cross_b), FadeOut(b_rect), run_time=0.4)

        # --- Test option C with x = 2 ---
        self.play(FadeOut(test_b), run_time=0.25)
        c_rect = SurroundingRectangle(opt_c, color=YELLOW, buff=0.08)
        self.play(Create(c_rect), run_time=0.3)

        test_c = MathTex(
            r"y = -\frac{24}{2} = -12", r"\neq 12",
            font_size=32
        )
        test_c[1].set_color(RED)
        test_c.shift(RIGHT * 2.5 + UP * 0.3)
        self.play(Write(test_c), run_time=0.6)
        self.wait(0.3)

        # Cross out C
        cross_c = Cross(opt_c, stroke_color=RED, stroke_width=3)
        self.play(Create(cross_c), FadeOut(c_rect), run_time=0.4)

        # --- Test option D with x = 2 ---
        self.play(FadeOut(test_c), run_time=0.25)
        d_rect = SurroundingRectangle(opt_d, color=YELLOW, buff=0.08)
        self.play(Create(d_rect), run_time=0.3)

        test_d = MathTex(
            r"y = 24(2) = 48", r"\neq 12",
            font_size=32
        )
        test_d[1].set_color(RED)
        test_d.shift(RIGHT * 2.5 + UP * 0.3)
        self.play(Write(test_d), run_time=0.6)
        self.wait(0.3)

        # Cross out D
        cross_d = Cross(opt_d, stroke_color=RED, stroke_width=3)
        self.play(Create(cross_d), FadeOut(d_rect), run_time=0.4)

        # --- Confirm option A ---
        self.play(FadeOut(test_d), FadeOut(test_header), run_time=0.25)

        a_rect = SurroundingRectangle(opt_a, color=GREEN, buff=0.1, stroke_width=3)
        self.play(Create(a_rect), run_time=0.4)

        check_a = MathTex(
            r"y = \frac{24}{2} = 12 \;\checkmark",
            font_size=34, color=GREEN
        )
        check_a.shift(RIGHT * 2.5 + UP * 0.3)
        self.play(Write(check_a), run_time=0.6)
        self.play(Flash(opt_a, color=GREEN, flash_radius=0.8))
        self.wait(0.5)

        # ============================================================
        # FINAL: Boxed takeaway
        # ============================================================
        scene4_extras = VGroup(
            subtitle4, options, cross_b, cross_c, cross_d,
            a_rect, check_a
        )
        self.play(FadeOut(scene4_extras), FadeOut(title), run_time=0.5)

        # Boxed takeaway
        final = MathTex(
            r"\text{Inverse variation: } y = \frac{k}{x}",
            r"\text{ where } k = x \cdot y",
            font_size=40
        )
        final[0].set_color(GREEN)
        final[1].set_color(WHITE)
        final.move_to(ORIGIN)

        final_box = SurroundingRectangle(
            final, color=GREEN, buff=0.25, stroke_width=3, corner_radius=0.1
        )

        self.play(Write(final), Create(final_box), run_time=1.0)
        self.wait(2)
