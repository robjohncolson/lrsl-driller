"""
Critical Values z* (AP Stats Unit 6, Topic 6.2)

Explains the role of the critical value z* in confidence intervals. Draws a
standard Normal curve, shades the middle C% region, marks tail areas, and
builds a reference table for common confidence levels (80%, 90%, 95%, 99%).
Animates transitions between confidence levels, showing how higher confidence
leads to larger z* and wider intervals.

Run with: manim -qm --format=mp4 apstat_62_critical_values.py CriticalValues
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class CriticalValues(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # Normal PDF
        def normal_pdf(x):
            return (1.0 / np.sqrt(2 * np.pi)) * np.exp(-0.5 * x ** 2)

        # ========== TITLE ==========
        title = Text("Critical Values (z*)", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "How many SDs wide should our interval be?",
            font_size=26, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(Write(subtitle))
        self.wait(0.5)

        # ========== EXPLANATION ==========
        explain = Text(
            "A C% confidence interval captures the middle C%",
            font_size=24,
        )
        explain2 = Text(
            "of the Normal distribution.",
            font_size=24,
        )
        explain.next_to(subtitle, DOWN, buff=0.3)
        explain2.next_to(explain, DOWN, buff=0.06)
        self.play(Write(explain), Write(explain2), run_time=0.7)
        self.wait(0.5)

        # ========== DRAW NORMAL CURVE ==========
        self.play(FadeOut(explain), FadeOut(explain2), FadeOut(subtitle), run_time=0.4)

        x_min, x_max = -3.8, 3.8
        axes = Axes(
            x_range=[x_min, x_max, 1],
            y_range=[0, 0.45, 0.1],
            x_length=10,
            y_length=3.2,
            axis_config={"include_tip": False, "include_numbers": False},
        )
        axes.shift(DOWN * 0.3)

        # X-axis labels
        x_labels = VGroup()
        for k in range(-3, 4):
            label = Text(f"{k}", font_size=16)
            label.next_to(axes.c2p(k, 0), DOWN, buff=0.1)
            x_labels.add(label)

        z_label = MathTex(r"z", font_size=28)
        z_label.next_to(axes.x_axis, RIGHT, buff=0.15)

        curve = axes.plot(
            normal_pdf,
            x_range=[x_min, x_max, 0.005],
            color=ManimColor(BLUE_3B1B),
            stroke_width=3,
        )

        self.play(Create(axes), FadeIn(x_labels), Write(z_label), run_time=0.5)
        self.play(Create(curve), run_time=0.8)
        self.wait(0.3)

        # ========== SHADE 95% FIRST ==========
        z_star_95 = 1.960

        # Shade middle 95%
        shaded_95 = axes.get_area(
            curve,
            x_range=[-z_star_95, z_star_95],
            color=ManimColor(TEAL_3B1B),
            opacity=0.45,
        )
        self.play(FadeIn(shaded_95), run_time=0.8)

        # Mark z* lines
        left_line = DashedLine(
            axes.c2p(-z_star_95, 0),
            axes.c2p(-z_star_95, normal_pdf(-z_star_95)),
            color=YELLOW_3B1B, stroke_width=2.5,
        )
        right_line = DashedLine(
            axes.c2p(z_star_95, 0),
            axes.c2p(z_star_95, normal_pdf(z_star_95)),
            color=YELLOW_3B1B, stroke_width=2.5,
        )
        self.play(Create(left_line), Create(right_line), run_time=0.5)

        # Labels for z*
        left_z_label = MathTex(r"-z^*", font_size=24, color=YELLOW_3B1B)
        left_z_label.next_to(axes.c2p(-z_star_95, 0), DOWN, buff=0.25)
        right_z_label = MathTex(r"+z^*", font_size=24, color=YELLOW_3B1B)
        right_z_label.next_to(axes.c2p(z_star_95, 0), DOWN, buff=0.25)
        self.play(Write(left_z_label), Write(right_z_label), run_time=0.4)

        # Middle label: "95%"
        middle_pct = Text("95%", font_size=28, color=WHITE, weight=BOLD)
        middle_pct.move_to(axes.c2p(0, 0.15))
        self.play(Write(middle_pct), run_time=0.4)

        # Tail area labels
        tail_area_formula = MathTex(
            r"\frac{1 - C}{2}",
            font_size=22, color=PINK_3B1B,
        )
        tail_area_formula.next_to(title, DOWN, buff=0.15)
        tail_text = Text("on each tail", font_size=20, color=PINK_3B1B)
        tail_text.next_to(tail_area_formula, RIGHT, buff=0.1)
        self.play(Write(tail_area_formula), Write(tail_text), run_time=0.5)

        left_tail_label = Text("2.5%", font_size=18, color=PINK_3B1B)
        left_tail_label.move_to(axes.c2p(-2.8, 0.08))
        right_tail_label = Text("2.5%", font_size=18, color=PINK_3B1B)
        right_tail_label.move_to(axes.c2p(2.8, 0.08))
        self.play(Write(left_tail_label), Write(right_tail_label), run_time=0.4)

        # z* = 1.960 label
        z_star_value = MathTex(r"z^* = 1.960", font_size=28, color=YELLOW_3B1B)
        z_star_value.next_to(right_line, UP, buff=0.15).shift(RIGHT * 0.3)
        self.play(Write(z_star_value), run_time=0.5)
        self.wait(0.8)

        # ========== CLEAR CURVE DECORATIONS, KEEP CURVE ==========
        curve_decorations = VGroup(
            shaded_95, left_line, right_line, left_z_label, right_z_label,
            middle_pct, left_tail_label, right_tail_label, z_star_value,
            tail_area_formula, tail_text,
        )
        self.play(FadeOut(curve_decorations), run_time=0.4)

        # ========== BUILD REFERENCE TABLE ==========
        # Shrink curve to upper portion
        curve_group = VGroup(axes, curve, x_labels, z_label)
        self.play(
            curve_group.animate.scale(0.55).to_edge(UP, buff=0.4).shift(LEFT * 2.5),
            run_time=0.5,
        )

        # Keep title
        self.play(
            title.animate.scale(0.75).to_corner(UL, buff=0.2),
            run_time=0.4,
        )

        # Table data
        conf_levels = [
            ("80\\%", "0.10", "1.282", 1.282),
            ("90\\%", "0.05", "1.645", 1.645),
            ("95\\%", "0.025", "1.960", 1.960),
            ("99\\%", "0.005", "2.576", 2.576),
        ]

        # Table header
        header_conf = Text("Confidence", font_size=20, weight=BOLD, color=YELLOW_3B1B)
        header_tail = Text("Tail Area", font_size=20, weight=BOLD, color=PINK_3B1B)
        header_zstar = Text("z*", font_size=20, weight=BOLD, color=TEAL_3B1B)

        col_spacing = 2.2
        table_start_x = 1.0
        table_start_y = 1.0

        header_conf.move_to(RIGHT * table_start_x + UP * table_start_y)
        header_tail.move_to(RIGHT * (table_start_x + col_spacing) + UP * table_start_y)
        header_zstar.move_to(RIGHT * (table_start_x + 2 * col_spacing) + UP * table_start_y)

        header_line = Line(
            RIGHT * (table_start_x - 0.8) + UP * (table_start_y - 0.15),
            RIGHT * (table_start_x + 2 * col_spacing + 0.6) + UP * (table_start_y - 0.15),
            color=GREY, stroke_width=1.5,
        )

        self.play(
            Write(header_conf), Write(header_tail), Write(header_zstar),
            Create(header_line),
            run_time=0.5,
        )

        # Build rows one at a time with curve shading
        row_groups = []
        row_y = table_start_y - 0.4

        for i, (conf, tail, zstar_str, zstar_val) in enumerate(conf_levels):
            row_conf = MathTex(conf, font_size=24)
            row_conf.move_to(RIGHT * table_start_x + UP * row_y)

            row_tail = MathTex(tail, font_size=24, color=PINK_3B1B)
            row_tail.move_to(RIGHT * (table_start_x + col_spacing) + UP * row_y)

            row_zstar = MathTex(zstar_str, font_size=24, color=TEAL_3B1B)
            row_zstar.move_to(RIGHT * (table_start_x + 2 * col_spacing) + UP * row_y)

            # Shade the curve for this confidence level
            shaded = axes.get_area(
                curve,
                x_range=[-zstar_val, zstar_val],
                color=ManimColor(TEAL_3B1B),
                opacity=0.4,
            )

            # Mark z* lines on curve
            z_left = DashedLine(
                axes.c2p(-zstar_val, 0),
                axes.c2p(-zstar_val, normal_pdf(-zstar_val)),
                color=YELLOW_3B1B, stroke_width=2,
            )
            z_right = DashedLine(
                axes.c2p(zstar_val, 0),
                axes.c2p(zstar_val, normal_pdf(zstar_val)),
                color=YELLOW_3B1B, stroke_width=2,
            )

            self.play(
                Write(row_conf), Write(row_tail), Write(row_zstar),
                FadeIn(shaded), Create(z_left), Create(z_right),
                run_time=0.6,
            )

            # Highlight the current row
            row_highlight = SurroundingRectangle(
                VGroup(row_conf, row_tail, row_zstar),
                color=YELLOW_3B1B, buff=0.08, corner_radius=0.05,
            )
            self.play(Create(row_highlight), run_time=0.3)
            self.wait(0.4)
            self.play(FadeOut(row_highlight), run_time=0.2)

            # Remove shading (keep curve clean for next row)
            self.play(FadeOut(shaded), FadeOut(z_left), FadeOut(z_right), run_time=0.2)

            row_groups.append(VGroup(row_conf, row_tail, row_zstar))
            row_y -= 0.4

        self.wait(0.3)

        # ========== KEY PATTERN ==========
        pattern_text = Text(
            "Higher confidence --> larger z* --> wider interval",
            font_size=24, color=YELLOW_3B1B, weight=BOLD,
        )
        pattern_text.move_to(UP * (row_y - 0.3) + RIGHT * (table_start_x + col_spacing))
        self.play(Write(pattern_text), run_time=0.6)
        self.wait(0.5)

        # Arrow showing increasing z*
        inc_arrow = Arrow(
            RIGHT * (table_start_x + 2 * col_spacing + 0.5) + UP * (table_start_y - 0.4),
            RIGHT * (table_start_x + 2 * col_spacing + 0.5) + UP * row_y,
            color=ManimColor(GREEN_3B1B), stroke_width=3, buff=0.05,
        )
        inc_label = Text("z* increases", font_size=16, color=ManimColor(GREEN_3B1B))
        inc_label.next_to(inc_arrow, RIGHT, buff=0.1)
        self.play(Create(inc_arrow), Write(inc_label), run_time=0.5)
        self.wait(0.5)

        # Box the entire table
        table_all = VGroup(
            header_conf, header_tail, header_zstar, header_line,
            *row_groups,
        )
        table_box = SurroundingRectangle(
            table_all, color=YELLOW_3B1B, buff=0.2, corner_radius=0.1,
        )
        self.play(Create(table_box), run_time=0.4)
        self.wait(0.8)

        # ========== CLEAR FOR INSIGHT ==========
        everything = VGroup(
            curve_group, title, table_all, table_box,
            pattern_text, inc_arrow, inc_label,
        )
        self.play(FadeOut(everything), run_time=0.5)

        # ========== KEY INSIGHT BOX ==========
        insight_content = VGroup(
            Text(
                "Critical Values (z*)",
                font_size=32, color=YELLOW_3B1B, weight=BOLD,
            ),
            Text("", font_size=6),  # spacer
            Text(
                "z* tells us how many SDs to go",
                font_size=24,
            ),
            Text(
                "in each direction from p-hat.",
                font_size=24,
            ),
            Text("", font_size=6),  # spacer
            VGroup(
                MathTex(r"90\%: z^* = 1.645", font_size=28),
                MathTex(r"95\%: z^* = 1.960", font_size=28, color=TEAL_3B1B),
                MathTex(r"99\%: z^* = 2.576", font_size=28),
            ).arrange(DOWN, buff=0.08),
            Text("", font_size=6),  # spacer
            Text(
                "Higher confidence = larger z* = wider interval",
                font_size=24, color=PINK_3B1B, weight=BOLD,
            ),
        ).arrange(DOWN, buff=0.12)
        insight_content.move_to(ORIGIN)

        box = SurroundingRectangle(
            insight_content, color=YELLOW_3B1B, buff=0.3, corner_radius=0.15,
        )

        self.play(
            LaggedStart(
                *[Write(line) for line in insight_content],
                lag_ratio=0.2,
            ),
            run_time=2.5,
        )
        self.play(Create(box))
        self.wait(2)
