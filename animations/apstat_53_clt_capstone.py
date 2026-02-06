"""
CLT Capstone Synthesis (AP Stats Unit 5, Topic 5.3e)

Synthesis animation combining all key 5.3 ideas: CLT statement and conditions
(independent, large n), when CLT applies vs does not (normal population = any n;
non-normal = need n >= 30), randomization distributions and what they test, and
the connection between CLT and randomization testing. Uses a concept-map style
with mini-visuals for each node.

Run with: manim -qm --format=mp4 apstat_53_clt_capstone.py CLTCapstone
"""
from manim import *
import numpy as np
from scipy.stats import norm

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class CLTCapstone(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"
        np.random.seed(42)

        # ========== TITLE ==========
        title = Text("Topic 5.3 Capstone: CLT and Randomization",
                      font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ========== PART 1: CLT Statement ==========
        clt_header = Text("The Central Limit Theorem", font_size=30,
                          color=BLUE_3B1B, weight=BOLD)
        clt_header.next_to(title, DOWN, buff=0.4)
        self.play(Write(clt_header))

        clt_statement = VGroup(
            Text("For a random sample of size n from ANY population", font_size=22),
            Text("with mean mu and SD sigma:", font_size=22),
            Text("", font_size=8),
            Text("The sampling distribution of x-bar is", font_size=22),
            Text("approximately Normal", font_size=26, color=BLUE_3B1B, weight=BOLD),
            Text("for sufficiently large n", font_size=22, color=YELLOW_3B1B),
        ).arrange(DOWN, buff=0.08)
        clt_statement.next_to(clt_header, DOWN, buff=0.25)

        self.play(
            LaggedStart(
                *[Write(line) for line in clt_statement],
                lag_ratio=0.25,
            ),
            run_time=2,
        )
        self.wait(0.5)

        # Mini bell curve next to statement
        xs = np.linspace(-3, 3, 100)
        ys = norm.pdf(xs, 0, 1)
        bell_pts = []
        bell_center = RIGHT * 5 + DOWN * 0.5
        for x, y in zip(xs, ys):
            bell_pts.append(bell_center + np.array([x * 0.5, y * 1.5 - 0.2, 0]))
        mini_bell = VMobject(stroke_color=BLUE_3B1B, stroke_width=2.5)
        mini_bell.set_points_smoothly(bell_pts)

        self.play(Create(mini_bell), run_time=0.5)
        self.wait(0.5)
        self.play(FadeOut(mini_bell), run_time=0.3)

        # Fade statement
        self.play(FadeOut(clt_statement), FadeOut(clt_header), run_time=0.4)

        # ========== PART 2: CLT Conditions ==========
        cond_header = Text("CLT Conditions", font_size=30,
                           color=TEAL_3B1B, weight=BOLD)
        cond_header.next_to(title, DOWN, buff=0.4)
        self.play(Write(cond_header))

        conditions = VGroup(
            Text("1. Random: Sample must be randomly selected", font_size=24),
            Text("2. Independent: n < 10% of population (10% rule)", font_size=24),
            Text("3. Large enough n (see below)", font_size=24, color=YELLOW_3B1B),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.2)
        conditions.next_to(cond_header, DOWN, buff=0.3)

        for cond in conditions:
            self.play(Write(cond), run_time=0.5)
            self.wait(0.2)

        self.wait(0.5)
        self.play(FadeOut(conditions), FadeOut(cond_header), run_time=0.4)

        # ========== PART 3: When Does CLT Apply? Decision Tree ==========
        when_header = Text("When Does CLT Apply?", font_size=30,
                           color=GREEN_3B1B, weight=BOLD)
        when_header.next_to(title, DOWN, buff=0.35)
        self.play(Write(when_header))

        # Helper for rounded rectangle nodes
        def make_node(text_str, color, pos, width=4.0, height=0.65, font_size=20):
            box = RoundedRectangle(
                corner_radius=0.12,
                width=width, height=height,
                stroke_color=color, stroke_width=2.5,
                fill_color=color, fill_opacity=0.12,
            )
            box.move_to(pos)
            label = Text(text_str, font_size=font_size, color=color)
            label.move_to(box.get_center())
            return VGroup(box, label)

        # Decision nodes
        q_node = make_node("Is the population Normal?", WHITE,
                           UP * 0.8, width=5)

        yes_node = make_node("YES: CLT works for ANY n", GREEN_3B1B,
                             DOWN * 0.2 + LEFT * 3, width=4.5)
        no_node = make_node("NO (skewed or unknown)", YELLOW_3B1B,
                            DOWN * 0.2 + RIGHT * 3, width=4.5)

        small_n_node = make_node("n < 30: CLT may NOT apply!", RED,
                                 DOWN * 1.3 + RIGHT * 1, width=4.5)
        large_n_node = make_node("n >= 30: CLT applies!", GREEN_3B1B,
                                 DOWN * 1.3 + RIGHT * 5, width=4)

        # Arrows
        arrow_yes = Arrow(q_node[0].get_bottom() + LEFT * 0.5,
                          yes_node[0].get_top(),
                          color=GREEN_3B1B, buff=0.08, stroke_width=2)
        yes_text = Text("Yes", font_size=16, color=GREEN_3B1B)
        yes_text.next_to(arrow_yes, LEFT, buff=0.05)

        arrow_no = Arrow(q_node[0].get_bottom() + RIGHT * 0.5,
                         no_node[0].get_top(),
                         color=YELLOW_3B1B, buff=0.08, stroke_width=2)
        no_text = Text("No", font_size=16, color=YELLOW_3B1B)
        no_text.next_to(arrow_no, RIGHT, buff=0.05)

        arrow_small = Arrow(no_node[0].get_bottom() + LEFT * 0.3,
                            small_n_node[0].get_top(),
                            color=RED, buff=0.08, stroke_width=2)
        arrow_large = Arrow(no_node[0].get_bottom() + RIGHT * 0.3,
                            large_n_node[0].get_top(),
                            color=GREEN_3B1B, buff=0.08, stroke_width=2)

        # Green check / red X for leaves
        check = Text("Use normal calculations!", font_size=18, color=GREEN_3B1B)
        check.next_to(yes_node, DOWN, buff=0.1)

        check2 = Text("Use normal calculations!", font_size=18, color=GREEN_3B1B)
        check2.next_to(large_n_node, DOWN, buff=0.1)

        caution = Text("Use other methods or larger sample", font_size=16, color=RED)
        caution.next_to(small_n_node, DOWN, buff=0.1)

        # Animate the tree
        self.play(FadeIn(q_node), run_time=0.5)
        self.play(Create(arrow_yes), Write(yes_text), FadeIn(yes_node), run_time=0.5)
        self.play(Write(check), run_time=0.3)
        self.play(Create(arrow_no), Write(no_text), FadeIn(no_node), run_time=0.5)
        self.play(
            Create(arrow_small), Create(arrow_large),
            FadeIn(small_n_node), FadeIn(large_n_node),
            run_time=0.5,
        )
        self.play(Write(caution), Write(check2), run_time=0.4)
        self.wait(0.8)

        # Clear the tree
        tree_group = VGroup(
            q_node, yes_node, no_node, small_n_node, large_n_node,
            arrow_yes, arrow_no, arrow_small, arrow_large,
            yes_text, no_text, check, check2, caution, when_header,
        )
        self.play(FadeOut(tree_group), run_time=0.5)

        # ========== PART 4: Randomization Distributions ==========
        rand_header = Text("Randomization Distributions", font_size=30,
                           color=PINK_3B1B, weight=BOLD)
        rand_header.next_to(title, DOWN, buff=0.35)
        self.play(Write(rand_header))

        rand_points = VGroup(
            Text("What they do:", font_size=24, color=YELLOW_3B1B, weight=BOLD),
            Text("  Simulate what happens under CHANCE ALONE", font_size=22),
            Text("  (assume H0: no real difference)", font_size=20, color=GRAY),
            Text("", font_size=6),
            Text("How to use:", font_size=24, color=YELLOW_3B1B, weight=BOLD),
            Text("  1. Pool all data, shuffle randomly", font_size=22),
            Text("  2. Compute statistic for each shuffle", font_size=22),
            Text("  3. Repeat many times (1000+)", font_size=22),
            Text("  4. Find p-value: proportion as extreme as observed", font_size=22),
            Text("", font_size=6),
            Text("Why it works:", font_size=24, color=YELLOW_3B1B, weight=BOLD),
            Text("  No assumptions about population shape needed!", font_size=22, color=GREEN_3B1B),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.08)
        rand_points.next_to(rand_header, DOWN, buff=0.3)

        self.play(
            LaggedStart(
                *[Write(line) for line in rand_points],
                lag_ratio=0.15,
            ),
            run_time=3,
        )
        self.wait(0.8)

        # Clear
        self.play(FadeOut(rand_points), FadeOut(rand_header), run_time=0.4)

        # ========== PART 5: Comparison Table ==========
        comp_header = Text("CLT vs. Randomization", font_size=30,
                           color=TEAL_3B1B, weight=BOLD)
        comp_header.next_to(title, DOWN, buff=0.35)
        self.play(Write(comp_header))

        # Table headers
        col1_header = Text("", font_size=20)
        col2_header = Text("CLT Approach", font_size=20, color=BLUE_3B1B, weight=BOLD)
        col3_header = Text("Randomization", font_size=20, color=PINK_3B1B, weight=BOLD)

        # Table rows
        rows_data = [
            ("Assumptions", "Normal pop or n>=30", "None on shape"),
            ("Method", "Formula-based", "Simulation-based"),
            ("Speed", "Fast (one calculation)", "Slower (many shuffles)"),
            ("Tests", "Is result unusual?", "Is result unusual?"),
        ]

        table_items = []
        y_start = -0.1
        row_spacing = 0.55
        col_positions = [-4, -0.8, 3.2]

        # Headers row
        col2_header.move_to(RIGHT * col_positions[1] + UP * (y_start + 0.5))
        col3_header.move_to(RIGHT * col_positions[2] + UP * (y_start + 0.5))
        self.play(Write(col2_header), Write(col3_header), run_time=0.4)

        # Separator line
        sep_line = Line(
            LEFT * 5.5 + UP * (y_start + 0.25),
            RIGHT * 5.5 + UP * (y_start + 0.25),
            color=GRAY, stroke_width=1,
        )
        self.play(Create(sep_line), run_time=0.2)

        for r_idx, (label, clt_text, rand_text) in enumerate(rows_data):
            y = y_start - r_idx * row_spacing
            lab = Text(label, font_size=18, color=YELLOW_3B1B)
            lab.move_to(RIGHT * col_positions[0] + UP * y)

            clt = Text(clt_text, font_size=18, color=BLUE_3B1B)
            clt.move_to(RIGHT * col_positions[1] + UP * y)

            rand = Text(rand_text, font_size=18, color=PINK_3B1B)
            rand.move_to(RIGHT * col_positions[2] + UP * y)

            self.play(Write(lab), Write(clt), Write(rand), run_time=0.4)
            table_items.extend([lab, clt, rand])

        # Same goal highlight
        same_label = Text(
            "Both answer: Is the observed result surprising?",
            font_size=22, color=GREEN_3B1B,
        )
        same_label.shift(DOWN * 2.4)
        self.play(Write(same_label), run_time=0.5)
        self.wait(0.8)

        # Clear table
        self.play(
            FadeOut(comp_header), FadeOut(col2_header), FadeOut(col3_header),
            FadeOut(sep_line), FadeOut(same_label),
            *[FadeOut(item) for item in table_items],
            run_time=0.5,
        )

        # ========== PART 6: Final Key Insight Box ==========
        insight_content = VGroup(
            Text("Topic 5.3 Key Takeaways", font_size=30,
                 color=YELLOW_3B1B, weight=BOLD),
            Text("", font_size=6),
            Text(
                "CLT lets us use normal calculations",
                font_size=26, color=BLUE_3B1B,
            ),
            Text(
                "  (when conditions are met: random, independent, large n)",
                font_size=20, color=GRAY,
            ),
            Text("", font_size=6),
            Text(
                "Randomization tests tell us if results are real",
                font_size=26, color=PINK_3B1B,
            ),
            Text(
                "  (no shape assumptions, simulation-based p-values)",
                font_size=20, color=GRAY,
            ),
            Text("", font_size=6),
            Text(
                "Small p-value = Evidence against H0",
                font_size=26, color=RED, weight=BOLD,
            ),
        ).arrange(DOWN, buff=0.08)
        insight_content.move_to(ORIGIN + DOWN * 0.2)

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

        # Quick formula flash at the bottom
        formulas = VGroup(
            Text("mean(x-bar) = mu", font_size=24, color=BLUE_3B1B),
            Text("SD(x-bar) = sigma/sqrt(n)", font_size=24, color=TEAL_3B1B),
            Text("p-value = tail proportion", font_size=24, color=PINK_3B1B),
        ).arrange(RIGHT, buff=0.8)
        formulas.next_to(box, DOWN, buff=0.3)

        self.play(Write(formulas), run_time=0.8)
        self.wait(2.5)
