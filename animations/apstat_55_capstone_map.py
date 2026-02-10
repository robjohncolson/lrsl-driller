"""
Topic 5.5 Capstone Concept Map (AP Stats Unit 5, Topic 5.5)

Visual flowchart showing the complete process for sampling distributions of
sample proportions: start with given p and n, check the 10% condition,
calculate parameters (mean and SD of p-hat), check large counts condition
for Normal approximation (with YES/NO branch), standardize with z-score,
and find probability. Builds step-by-step so students can follow the logic.

Run with: manim -qm --format=mp4 apstat_55_capstone_map.py CapstoneMap
"""
from manim import *

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class CapstoneMap(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("Topic 5.5: Complete Process", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "Sampling Distributions for Sample Proportions",
            font_size=24, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(FadeIn(subtitle))
        self.wait(0.5)

        # Fade subtitle to make room for flowchart
        self.play(FadeOut(subtitle), run_time=0.3)

        # ========== HELPER: Rounded rectangle node ==========
        def make_box(texts, box_color, pos, width=5.5, min_height=0.7):
            """Create a rounded rectangle with centered text content."""
            content = VGroup()
            for t_str, t_size, t_color, t_weight in texts:
                if t_str.startswith("$") and t_str.endswith("$"):
                    # MathTex content (strip $ markers)
                    item = MathTex(t_str[1:-1], font_size=t_size, color=t_color)
                else:
                    item = Text(
                        t_str, font_size=t_size, color=t_color,
                        weight=t_weight if t_weight else NORMAL,
                    )
                content.add(item)
            content.arrange(DOWN, buff=0.06)

            content_height = content.get_height()
            box_height = max(min_height, content_height + 0.3)

            box = RoundedRectangle(
                corner_radius=0.15,
                width=width, height=box_height,
                stroke_color=box_color, stroke_width=2.5,
                fill_color=box_color, fill_opacity=0.1,
            )
            box.move_to(pos)
            content.move_to(box.get_center())
            return VGroup(box, content)

        def make_arrow(start_mob, end_mob, color=WHITE):
            """Create an arrow from bottom of start to top of end."""
            return Arrow(
                start_mob[0].get_bottom(),
                end_mob[0].get_top(),
                color=color, buff=0.08, stroke_width=2.5,
                max_tip_length_to_length_ratio=0.15,
            )

        # ========== FLOWCHART LAYOUT ==========
        # Vertical positions for center-column boxes
        y_start = 2.3
        y_step = 1.15

        # ---- BOX 1: Given p and n ----
        box1 = make_box(
            [("Given: p and n", 24, BLUE_3B1B, BOLD)],
            BLUE_3B1B, UP * y_start, width=4.0,
        )
        self.play(FadeIn(box1), run_time=0.6)
        self.wait(0.4)

        # ---- ARROW 1->2 ----
        box2_pos = UP * (y_start - y_step)
        box2 = make_box(
            [
                ("Check 10% Condition", 22, YELLOW_3B1B, BOLD),
                ("$n < 0.10N$", 22, WHITE, None),
            ],
            YELLOW_3B1B, box2_pos, width=5.0,
        )
        arrow1 = make_arrow(box1, box2, WHITE)
        self.play(Create(arrow1), run_time=0.3)
        self.play(FadeIn(box2), run_time=0.6)
        self.wait(0.4)

        # ---- ARROW 2->3 ----
        box3_pos = UP * (y_start - 2 * y_step)
        box3 = make_box(
            [
                ("Calculate Parameters", 22, BLUE_3B1B, BOLD),
                (r"$\mu_{\hat{p}} = p$", 22, WHITE, None),
                (r"$\sigma_{\hat{p}} = \sqrt{\frac{p(1-p)}{n}}$", 22, WHITE, None),
            ],
            BLUE_3B1B, box3_pos, width=5.0, min_height=1.0,
        )
        arrow2 = make_arrow(box2, box3, WHITE)
        self.play(Create(arrow2), run_time=0.3)
        self.play(FadeIn(box3), run_time=0.6)
        self.wait(0.5)

        # ---- ARROW 3->4 ----
        box4_pos = UP * (y_start - 3.25 * y_step)
        box4 = make_box(
            [
                ("Check Large Counts", 22, YELLOW_3B1B, BOLD),
                (r"$np \geq 10$", 20, WHITE, None),
                ("AND", 16, GRAY, None),
                (r"$n(1-p) \geq 10$", 20, WHITE, None),
            ],
            YELLOW_3B1B, box4_pos, width=5.0, min_height=1.0,
        )
        arrow3 = make_arrow(box3, box4, WHITE)
        self.play(Create(arrow3), run_time=0.3)
        self.play(FadeIn(box4), run_time=0.6)
        self.wait(0.5)

        # ---- YES/NO BRANCH from Box 4 ----
        branch_y = y_start - 4.45 * y_step

        # Box 5a (YES - left): Use Normal Model
        box5a = make_box(
            [("Use Normal Model", 20, GREEN_3B1B, BOLD),
             (r"for $\hat{p}$", 20, GREEN_3B1B, None)],
            GREEN_3B1B, LEFT * 3.0 + UP * branch_y, width=3.8,
        )

        # Box 5b (NO - right): Cannot use Normal Model
        box5b = make_box(
            [("Cannot Use", 20, RED, BOLD),
             ("Normal Model", 20, RED, None)],
            RED, RIGHT * 3.0 + UP * branch_y, width=3.8,
        )

        # YES arrow (left)
        arrow_yes = Arrow(
            box4[0].get_bottom() + LEFT * 0.6,
            box5a[0].get_top(),
            color=GREEN_3B1B, buff=0.08, stroke_width=2.5,
            max_tip_length_to_length_ratio=0.15,
        )
        yes_label = Text("YES", font_size=18, color=GREEN_3B1B, weight=BOLD)
        yes_label.next_to(arrow_yes.get_start(), LEFT, buff=0.1).shift(DOWN * 0.3)

        # NO arrow (right)
        arrow_no = Arrow(
            box4[0].get_bottom() + RIGHT * 0.6,
            box5b[0].get_top(),
            color=RED, buff=0.08, stroke_width=2.5,
            max_tip_length_to_length_ratio=0.15,
        )
        no_label = Text("NO", font_size=18, color=RED, weight=BOLD)
        no_label.next_to(arrow_no.get_start(), RIGHT, buff=0.1).shift(DOWN * 0.3)

        # Animate YES branch
        self.play(
            Create(arrow_yes), Write(yes_label),
            FadeIn(box5a),
            run_time=0.7,
        )
        self.wait(0.3)

        # Animate NO branch
        self.play(
            Create(arrow_no), Write(no_label),
            FadeIn(box5b),
            run_time=0.7,
        )
        self.wait(0.3)

        # Red X on the NO box to emphasize STOP
        stop_x = Text("STOP", font_size=16, color=RED, weight=BOLD)
        stop_x.next_to(box5b, DOWN, buff=0.1)
        self.play(Write(stop_x), run_time=0.3)
        self.wait(0.4)

        # ---- ARROW 5a -> 6: Standardize ----
        box6_pos = LEFT * 3.0 + UP * (branch_y - 1.15)
        box6 = make_box(
            [
                ("Standardize", 20, BLUE_3B1B, BOLD),
                (r"$z = \frac{\hat{p} - p}{\sigma_{\hat{p}}}$", 22, WHITE, None),
            ],
            BLUE_3B1B, box6_pos, width=3.8, min_height=0.9,
        )
        arrow5 = Arrow(
            box5a[0].get_bottom(),
            box6[0].get_top(),
            color=WHITE, buff=0.08, stroke_width=2.5,
            max_tip_length_to_length_ratio=0.15,
        )
        self.play(Create(arrow5), run_time=0.3)
        self.play(FadeIn(box6), run_time=0.6)
        self.wait(0.4)

        # ---- ARROW 6 -> 7: Find probability ----
        box7_pos = LEFT * 3.0 + UP * (branch_y - 2.3)
        box7 = make_box(
            [
                ("Find Probability", 20, GREEN_3B1B, BOLD),
                ("using z-table / normalcdf", 18, WHITE, None),
            ],
            GREEN_3B1B, box7_pos, width=3.8,
        )
        arrow6 = Arrow(
            box6[0].get_bottom(),
            box7[0].get_top(),
            color=WHITE, buff=0.08, stroke_width=2.5,
            max_tip_length_to_length_ratio=0.15,
        )
        self.play(Create(arrow6), run_time=0.3)
        self.play(FadeIn(box7), run_time=0.6)
        self.wait(0.8)

        # ========== SURROUNDING RECTANGLE around the whole map ==========
        all_boxes = VGroup(
            box1, arrow1, box2, arrow2, box3, arrow3, box4,
            arrow_yes, yes_label, arrow_no, no_label,
            box5a, box5b, stop_x,
            arrow5, box6, arrow6, box7,
        )
        big_rect = SurroundingRectangle(
            all_boxes, color=TEAL_3B1B, buff=0.25,
            corner_radius=0.2, stroke_width=2.5,
        )
        self.play(Create(big_rect), run_time=0.8)
        self.wait(0.5)

        # ========== FINAL INSIGHT ==========
        # Fade everything and show closing insight
        self.play(
            FadeOut(all_boxes), FadeOut(big_rect), FadeOut(title),
            run_time=0.6,
        )

        insight_title = Text(
            "Topic 5.5 Key Takeaway", font_size=32,
            color=YELLOW_3B1B, weight=BOLD,
        )
        insight_line1 = Text(
            "This is the complete process for", font_size=26,
        )
        insight_line2 = Text(
            "sampling distributions of", font_size=26,
        )
        insight_phat = MathTex(r"\hat{p}", font_size=40, color=BLUE_3B1B)
        insight_spacer = Text("", font_size=8)
        insight_steps = Text(
            "Given  ->  Conditions  ->  Parameters  ->  Normal?  ->  z  ->  P",
            font_size=22, color=TEAL_3B1B,
        )

        insight_content = VGroup(
            insight_title,
            insight_spacer,
            insight_line1, insight_line2, insight_phat,
            Text("", font_size=10),
            insight_steps,
        ).arrange(DOWN, buff=0.12)
        insight_content.move_to(ORIGIN)

        insight_box = SurroundingRectangle(
            insight_content, color=YELLOW_3B1B, buff=0.35,
            corner_radius=0.15, stroke_width=3,
        )

        self.play(
            LaggedStart(
                *[Write(line) for line in insight_content],
                lag_ratio=0.2,
            ),
            run_time=2.5,
        )
        self.play(Create(insight_box), run_time=0.5)
        self.wait(2.5)
