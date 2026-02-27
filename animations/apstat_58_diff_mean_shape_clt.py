"""
Shape Conditions for the Sampling Distribution of x-bar1 - x-bar2 (AP Stats Unit 5, Topic 5.8)

Demonstrates when the sampling distribution of x-bar1 - x-bar2 is approximately normal.
Two paths to normality:
  Path 1 - BOTH populations are normal: x-bar1 - x-bar2 is normal for ANY n1, n2
  Path 2 - BOTH sample sizes are large: n1 >= 30 AND n2 >= 30 (CLT)
Key emphasis: must check BOTH populations/samples, not just one.
Common error: n1 + n2 >= 30 is NOT enough -- need BOTH >= 30 individually.

Run: manim -qm --format=mp4 apstat_58_diff_mean_shape_clt.py DiffMeanShape
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class DiffMeanShape(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"
        np.random.seed(42)

        # ========== TITLE ==========
        title = Text(
            "When is x-bar1 - x-bar2 Approximately Normal?",
            font_size=34, weight=BOLD,
        )
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "Two Paths to Normality",
            font_size=26, color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(FadeIn(subtitle))
        self.wait(0.5)
        self.play(FadeOut(subtitle), run_time=0.3)

        # ========== TWO PATHS SIDE BY SIDE ==========
        path1_header = Text(
            "Path 1", font_size=28, color=BLUE_3B1B, weight=BOLD,
        )
        path2_header = Text(
            "Path 2", font_size=28, color=TEAL_3B1B, weight=BOLD,
        )
        path1_header.move_to(LEFT * 3.3 + UP * 2.1)
        path2_header.move_to(RIGHT * 3.3 + UP * 2.1)

        path1_desc = Text(
            "BOTH populations Normal",
            font_size=22, color=BLUE_3B1B,
        )
        path2_desc = Text(
            "BOTH sample sizes large",
            font_size=22, color=TEAL_3B1B,
        )
        path1_desc.next_to(path1_header, DOWN, buff=0.15)
        path2_desc.next_to(path2_header, DOWN, buff=0.15)

        path1_result = Text(
            "Normal for ANY n1, n2",
            font_size=20, color=GREEN_3B1B,
        )
        path2_result = Text(
            "Need n1 >= 30 AND n2 >= 30",
            font_size=20, color=GREEN_3B1B,
        )
        path1_result.next_to(path1_desc, DOWN, buff=0.1)
        path2_result.next_to(path2_desc, DOWN, buff=0.1)

        path1_sub = Text(
            "(even n1 = 3, n2 = 5)",
            font_size=16, color=GREY_B,
        )
        path2_sub = Text(
            "(CLT applies to EACH)",
            font_size=16, color=GREY_B,
        )
        path1_sub.next_to(path1_result, DOWN, buff=0.08)
        path2_sub.next_to(path2_result, DOWN, buff=0.08)

        # Divider line
        divider = DashedLine(
            UP * 2.4 + ORIGIN, DOWN * 1.2 + ORIGIN,
            color=GREY, stroke_width=1.5,
        )

        path1_group = VGroup(path1_header, path1_desc, path1_result, path1_sub)
        path2_group = VGroup(path2_header, path2_desc, path2_result, path2_sub)

        path1_box = SurroundingRectangle(
            path1_group, color=BLUE_3B1B, buff=0.2, corner_radius=0.1,
        )
        path2_box = SurroundingRectangle(
            path2_group, color=TEAL_3B1B, buff=0.2, corner_radius=0.1,
        )

        self.play(
            Write(path1_header), Write(path2_header),
            Create(divider),
            run_time=0.6,
        )
        self.play(
            Write(path1_desc), Write(path2_desc),
            run_time=0.6,
        )
        self.play(
            Write(path1_result), Write(path2_result),
            run_time=0.6,
        )
        self.play(
            Write(path1_sub), Write(path2_sub),
            run_time=0.4,
        )
        self.play(
            Create(path1_box), Create(path2_box),
            run_time=0.5,
        )
        self.wait(0.8)

        # Key emphasis below
        emphasis = Text(
            "Must check BOTH populations/samples -- not just one!",
            font_size=24, color=YELLOW_3B1B, weight=BOLD,
        )
        emphasis.move_to(DOWN * 1.8)
        emphasis_box = SurroundingRectangle(
            emphasis, color=YELLOW_3B1B, buff=0.15, corner_radius=0.1,
        )
        self.play(Write(emphasis), Create(emphasis_box), run_time=0.6)
        self.wait(0.8)

        # ========== CLEAR TWO-PATH OVERVIEW ==========
        overview_all = VGroup(
            path1_group, path2_group,
            path1_box, path2_box, divider,
            emphasis, emphasis_box,
        )
        self.play(FadeOut(overview_all), run_time=0.5)

        # ========== VISUAL CASES: THREE SCENARIOS ==========
        cases_title = Text(
            "Three Cases", font_size=30, color=YELLOW_3B1B, weight=BOLD,
        )
        cases_title.next_to(title, DOWN, buff=0.25)
        self.play(Write(cases_title), run_time=0.4)
        self.wait(0.2)

        # --- Helper: draw a bell curve in an axes group ---
        def make_bell_curve(ax, color, sigma=1.0):
            curve = ax.plot(
                lambda x: (1 / (sigma * np.sqrt(2 * np.pi))) * np.exp(-0.5 * (x / sigma) ** 2),
                x_range=[-3.5, 3.5],
                color=color,
                stroke_width=2.5,
            )
            fill = ax.get_area(curve, x_range=[-3.5, 3.5], color=color, opacity=0.2)
            return VGroup(curve, fill)

        # --- Helper: draw a skewed distribution using bars ---
        def make_skewed_bars(center, width=2.2, height=1.0, color=PINK_3B1B):
            # Chi-squared-like shape: right skewed
            bar_data = [0.3, 0.7, 1.0, 0.85, 0.6, 0.4, 0.25, 0.12, 0.05]
            bars = VGroup()
            bar_w = width / len(bar_data)
            for i, h in enumerate(bar_data):
                bar = Rectangle(
                    width=bar_w * 0.85,
                    height=max(h * height, 0.02),
                    fill_color=color,
                    fill_opacity=0.6,
                    stroke_color=WHITE,
                    stroke_width=0.8,
                )
                x_pos = center[0] + (i - len(bar_data) / 2 + 0.5) * bar_w
                bar.move_to(np.array([x_pos, center[1] + h * height / 2, 0]))
                bars.add(bar)
            return bars

        def make_small_axes(pos):
            ax = Axes(
                x_range=[-4, 4, 1],
                y_range=[0, 0.45, 0.1],
                x_length=2.6,
                y_length=1.2,
                axis_config={
                    "include_tip": False,
                    "include_numbers": False,
                    "stroke_width": 1.2,
                },
            )
            ax.move_to(pos)
            return ax

        # === CASE 1: Both normal populations ===
        case1_label = Text("Case 1:", font_size=22, color=BLUE_3B1B, weight=BOLD)
        case1_label.move_to(LEFT * 6 + UP * 0.8)

        # Pop 1: bell curve
        ax1a = make_small_axes(LEFT * 4 + UP * 0.2)
        bell1a = make_bell_curve(ax1a, BLUE_3B1B)
        lab1a = Text("Pop 1: Normal", font_size=14, color=BLUE_3B1B)
        lab1a.next_to(ax1a, DOWN, buff=0.08)

        # Pop 2: bell curve
        ax1b = make_small_axes(LEFT * 1.2 + UP * 0.2)
        bell1b = make_bell_curve(ax1b, BLUE_3B1B, sigma=1.3)
        lab1b = Text("Pop 2: Normal", font_size=14, color=BLUE_3B1B)
        lab1b.next_to(ax1b, DOWN, buff=0.08)

        # Result
        arrow1 = Arrow(
            RIGHT * 0.5 + UP * 0.2, RIGHT * 1.5 + UP * 0.2,
            color=YELLOW_3B1B, stroke_width=2.5, buff=0.05,
        )
        result1 = Text("Normal for\nany n1, n2", font_size=16, color=GREEN_3B1B)
        result1.next_to(arrow1, RIGHT, buff=0.15)
        check1 = MathTex(r"\checkmark", font_size=40, color=GREEN_3B1B)
        check1.next_to(result1, RIGHT, buff=0.2)

        case1_group = VGroup(
            case1_label, ax1a, bell1a, lab1a, ax1b, bell1b, lab1b,
            arrow1, result1, check1,
        )

        self.play(
            Write(case1_label),
            Create(ax1a), FadeIn(bell1a),
            Create(ax1b), FadeIn(bell1b),
            Write(lab1a), Write(lab1b),
            run_time=0.8,
        )
        self.play(
            GrowArrow(arrow1), Write(result1),
            FadeIn(check1, scale=1.5),
            run_time=0.6,
        )
        self.wait(0.5)

        # === CASE 2: Both skewed, small n ===
        case2_label = Text("Case 2:", font_size=22, color=PINK_3B1B, weight=BOLD)
        case2_label.move_to(LEFT * 6 + DOWN * 1.2)

        bars2a = make_skewed_bars(
            center=np.array([-4, -1.5, 0]), width=2.2, height=0.9, color=PINK_3B1B,
        )
        lab2a = Text("Pop 1: Skewed", font_size=14, color=PINK_3B1B)
        lab2a.next_to(bars2a, DOWN, buff=0.08)

        bars2b = make_skewed_bars(
            center=np.array([-1.2, -1.5, 0]), width=2.2, height=0.9, color=PINK_3B1B,
        )
        lab2b = Text("Pop 2: Skewed", font_size=14, color=PINK_3B1B)
        lab2b.next_to(bars2b, DOWN, buff=0.08)

        n_label_2 = Text("n1=10, n2=10", font_size=16, color=GREY_B)
        n_label_2.move_to(RIGHT * 0.3 + DOWN * 1.0)

        arrow2 = Arrow(
            RIGHT * 0.5 + DOWN * 1.5, RIGHT * 1.5 + DOWN * 1.5,
            color=YELLOW_3B1B, stroke_width=2.5, buff=0.05,
        )
        result2 = Text("NOT normal", font_size=16, color=PINK_3B1B)
        result2.next_to(arrow2, RIGHT, buff=0.15)
        cross2 = Text("X", font_size=32, color=PINK_3B1B, weight=BOLD)
        cross2.next_to(result2, RIGHT, buff=0.2)

        case2_group = VGroup(
            case2_label, bars2a, lab2a, bars2b, lab2b,
            n_label_2, arrow2, result2, cross2,
        )

        self.play(
            Write(case2_label),
            LaggedStart(
                *[GrowFromEdge(bar, DOWN) for bar in bars2a],
                lag_ratio=0.04,
            ),
            LaggedStart(
                *[GrowFromEdge(bar, DOWN) for bar in bars2b],
                lag_ratio=0.04,
            ),
            Write(lab2a), Write(lab2b),
            run_time=0.8,
        )
        self.play(Write(n_label_2), run_time=0.3)
        self.play(
            GrowArrow(arrow2), Write(result2),
            FadeIn(cross2, scale=1.5),
            run_time=0.6,
        )
        self.wait(0.5)

        # === CASE 3: Both skewed, large n ===
        case3_label = Text("Case 3:", font_size=22, color=TEAL_3B1B, weight=BOLD)
        case3_label.move_to(LEFT * 6 + DOWN * 3.0)

        bars3a = make_skewed_bars(
            center=np.array([-4, -3.3, 0]), width=2.2, height=0.9, color=TEAL_3B1B,
        )
        lab3a = Text("Pop 1: Skewed", font_size=14, color=TEAL_3B1B)
        lab3a.next_to(bars3a, DOWN, buff=0.08)

        bars3b = make_skewed_bars(
            center=np.array([-1.2, -3.3, 0]), width=2.2, height=0.9, color=TEAL_3B1B,
        )
        lab3b = Text("Pop 2: Skewed", font_size=14, color=TEAL_3B1B)
        lab3b.next_to(bars3b, DOWN, buff=0.08)

        n_label_3 = Text("n1=30, n2=30", font_size=16, color=GREEN_3B1B, weight=BOLD)
        n_label_3.move_to(RIGHT * 0.3 + DOWN * 2.8)

        arrow3 = Arrow(
            RIGHT * 0.5 + DOWN * 3.3, RIGHT * 1.5 + DOWN * 3.3,
            color=YELLOW_3B1B, stroke_width=2.5, buff=0.05,
        )
        result3 = Text("Approx Normal\n(CLT)", font_size=16, color=GREEN_3B1B)
        result3.next_to(arrow3, RIGHT, buff=0.15)
        check3 = MathTex(r"\checkmark", font_size=40, color=GREEN_3B1B)
        check3.next_to(result3, RIGHT, buff=0.2)

        case3_group = VGroup(
            case3_label, bars3a, lab3a, bars3b, lab3b,
            n_label_3, arrow3, result3, check3,
        )

        self.play(
            Write(case3_label),
            LaggedStart(
                *[GrowFromEdge(bar, DOWN) for bar in bars3a],
                lag_ratio=0.04,
            ),
            LaggedStart(
                *[GrowFromEdge(bar, DOWN) for bar in bars3b],
                lag_ratio=0.04,
            ),
            Write(lab3a), Write(lab3b),
            run_time=0.8,
        )
        self.play(Write(n_label_3), run_time=0.3)
        self.play(
            GrowArrow(arrow3), Write(result3),
            FadeIn(check3, scale=1.5),
            run_time=0.6,
        )
        self.wait(0.8)

        # ========== CLEAR CASES ==========
        self.play(
            FadeOut(cases_title),
            FadeOut(case1_group), FadeOut(case2_group), FadeOut(case3_group),
            run_time=0.5,
        )

        # ========== WRONG EXAMPLE: Mixed populations ==========
        wrong_title = Text(
            "Common Mistake", font_size=30, color=PINK_3B1B, weight=BOLD,
        )
        wrong_title.next_to(title, DOWN, buff=0.25)
        self.play(Write(wrong_title), run_time=0.4)

        wrong_scenario = VGroup(
            Text("Pop 1 is Normal", font_size=24, color=BLUE_3B1B),
            Text("Pop 2 is Skewed, n2 = 10", font_size=24, color=PINK_3B1B),
        ).arrange(DOWN, buff=0.15)
        wrong_scenario.next_to(wrong_title, DOWN, buff=0.3)

        self.play(Write(wrong_scenario[0]), run_time=0.4)
        self.play(Write(wrong_scenario[1]), run_time=0.4)
        self.wait(0.3)

        # Verdict
        wrong_verdict = Text(
            "NOT approximately normal!",
            font_size=26, color=PINK_3B1B, weight=BOLD,
        )
        wrong_verdict.next_to(wrong_scenario, DOWN, buff=0.3)
        wrong_cross = Text("X", font_size=40, color=PINK_3B1B, weight=BOLD)
        wrong_cross.next_to(wrong_verdict, RIGHT, buff=0.2)

        self.play(Write(wrong_verdict), FadeIn(wrong_cross, scale=1.5), run_time=0.5)
        self.wait(0.3)

        # Explanation
        wrong_explain = VGroup(
            Text("Why? Pop 2 is skewed AND n2 < 30", font_size=22, color=YELLOW_3B1B),
            Text("Path 1 fails: not BOTH normal", font_size=20, color=GREY_B),
            Text("Path 2 fails: not BOTH n >= 30", font_size=20, color=GREY_B),
        ).arrange(DOWN, buff=0.1)
        wrong_explain.next_to(wrong_verdict, DOWN, buff=0.3)

        self.play(
            LaggedStart(*[Write(line) for line in wrong_explain], lag_ratio=0.2),
            run_time=1.0,
        )
        self.wait(0.8)

        # ========== CLEAR WRONG EXAMPLE ==========
        wrong_all = VGroup(
            wrong_title, wrong_scenario, wrong_verdict, wrong_cross, wrong_explain,
        )
        self.play(FadeOut(wrong_all), run_time=0.5)

        # ========== COMMON ERROR BOX ==========
        error_header = Text(
            "Common Error", font_size=30, color=PINK_3B1B, weight=BOLD,
        )
        error_header.next_to(title, DOWN, buff=0.3)
        self.play(Write(error_header), run_time=0.4)

        error_wrong = MathTex(
            r"n_1 + n_2 \geq 30",
            font_size=36, color=PINK_3B1B,
        )
        error_wrong.next_to(error_header, DOWN, buff=0.3)

        not_enough = Text(
            "is NOT enough!",
            font_size=26, color=PINK_3B1B, weight=BOLD,
        )
        not_enough.next_to(error_wrong, RIGHT, buff=0.2)

        # Strike-through line over the wrong formula
        strike = Line(
            error_wrong.get_left() + LEFT * 0.1,
            error_wrong.get_right() + RIGHT * 0.1,
            color=RED, stroke_width=4,
        )

        self.play(Write(error_wrong), Write(not_enough), run_time=0.6)
        self.play(Create(strike), run_time=0.4)
        self.wait(0.3)

        # Correct version
        correct_label = Text(
            "Need BOTH individually:",
            font_size=24, color=GREEN_3B1B,
        )
        correct_label.next_to(error_wrong, DOWN, buff=0.4)

        correct_formula = MathTex(
            r"n_1 \geq 30 \quad \text{AND} \quad n_2 \geq 30",
            font_size=34, color=GREEN_3B1B,
        )
        correct_formula.next_to(correct_label, DOWN, buff=0.15)

        correct_box = SurroundingRectangle(
            VGroup(correct_label, correct_formula),
            color=GREEN_3B1B, buff=0.2, corner_radius=0.1,
        )

        self.play(Write(correct_label), run_time=0.4)
        self.play(Write(correct_formula), Create(correct_box), run_time=0.6)
        self.wait(0.3)

        # Counterexample
        counter = Text(
            "Example: n1=20, n2=10 -- sum is 30 but NEITHER >= 30",
            font_size=20, color=YELLOW_3B1B,
        )
        counter.next_to(correct_box, DOWN, buff=0.3)
        self.play(Write(counter), run_time=0.6)
        self.wait(0.8)

        # ========== CLEAR ERROR SECTION ==========
        error_all = VGroup(
            error_header, error_wrong, not_enough, strike,
            correct_label, correct_formula, correct_box, counter,
        )
        self.play(FadeOut(error_all), FadeOut(title), run_time=0.5)

        # ========== SUMMARY BOX ==========
        summary_content = VGroup(
            Text(
                "Shape of the Distribution of x-bar1 - x-bar2",
                font_size=30, color=YELLOW_3B1B, weight=BOLD,
            ),
            Text("", font_size=6),  # spacer
            VGroup(
                Text("Path 1:", font_size=24, color=BLUE_3B1B, weight=BOLD),
                Text("  BOTH populations Normal", font_size=22),
            ).arrange(RIGHT, buff=0.1),
            Text(
                "    --> Normal for ANY sample sizes",
                font_size=20, color=GREEN_3B1B,
            ),
            Text("", font_size=6),  # spacer
            VGroup(
                Text("Path 2:", font_size=24, color=TEAL_3B1B, weight=BOLD),
                Text("  BOTH n1 >= 30 AND n2 >= 30", font_size=22),
            ).arrange(RIGHT, buff=0.1),
            Text(
                "    --> CLT makes it approximately Normal",
                font_size=20, color=GREEN_3B1B,
            ),
            Text("", font_size=6),  # spacer
            Text(
                "Check BOTH -- one is not enough!",
                font_size=22, color=PINK_3B1B, weight=BOLD,
            ),
        ).arrange(DOWN, buff=0.1, aligned_edge=LEFT)
        summary_content.move_to(ORIGIN)

        summary_box = SurroundingRectangle(
            summary_content, color=YELLOW_3B1B, buff=0.3, corner_radius=0.15,
        )

        self.play(
            LaggedStart(
                *[Write(line) for line in summary_content],
                lag_ratio=0.15,
            ),
            run_time=2.5,
        )
        self.play(Create(summary_box), run_time=0.5)
        self.wait(2)
