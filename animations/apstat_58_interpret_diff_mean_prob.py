"""
Interpreting Probabilities for x-bar_1 - x-bar_2 (AP Stats Unit 5, Topic 5.8)

Teaches students how to correctly interpret a probability result from the
sampling distribution of the difference in sample means. Shows a WRONG
interpretation (individual fruits) vs. a CORRECT interpretation (sample means),
highlights each key element, introduces the 5% unusual threshold, contrasts
with a not-unusual counter-example, and finishes with a checklist summary.

Run: manim -qm --format=mp4 apstat_58_interpret_diff_mean_prob.py DiffMeanInterpretProb
"""

from manim import *


class DiffMeanInterpretProb(Scene):
    def construct(self):
        # ---- Style constants ----
        self.camera.background_color = "#1C1C1C"

        BLUE_3B1B = "#3B82F6"
        YELLOW_3B1B = "#FACC15"
        TEAL_3B1B = "#2DD4BF"
        GREEN_3B1B = "#22C55E"
        PINK_3B1B = "#EC4899"
        GOLD = "#FFD700"
        RED = "#EF4444"

        # ================================================================
        #  SECTION 1: TITLE + GIVEN PROBABILITY
        # ================================================================
        title_line1 = Text(
            "Interpreting Probabilities:",
            font_size=38, weight=BOLD,
        )
        title_math = MathTex(
            r"\bar{x}_1 - \bar{x}_2",
            font_size=44, color=TEAL_3B1B,
        )
        title_row = VGroup(title_line1, title_math).arrange(RIGHT, buff=0.15)
        title_row.to_edge(UP, buff=0.35)

        self.play(Write(title_row), run_time=0.8)
        self.wait(0.5)

        # Given probability statement
        given_header = Text(
            "Given:", font_size=26, color=ManimColor(YELLOW_3B1B), weight=BOLD,
        )
        given_prob = MathTex(
            r"P(\bar{x}_1 - \bar{x}_2 > 1.5) = 0.025",
            font_size=32, color=ManimColor(YELLOW_3B1B),
        )
        given_context = Text(
            "Lemons (n\u2081=6) vs. Oranges (n\u2082=6), weights in oz",
            font_size=22, color=GRAY_B,
        )
        given_group = VGroup(given_header, given_prob, given_context).arrange(
            DOWN, buff=0.12,
        )
        given_group.next_to(title_row, DOWN, buff=0.35)

        given_box = SurroundingRectangle(
            given_group, color=ManimColor(YELLOW_3B1B), buff=0.2,
            corner_radius=0.1, stroke_width=2,
        )

        self.play(Write(given_header), run_time=0.4)
        self.play(Write(given_prob), run_time=0.6)
        self.play(Write(given_context), run_time=0.5)
        self.play(Create(given_box), run_time=0.4)
        self.wait(1.5)

        # ================================================================
        #  SECTION 2: WRONG INTERPRETATION
        # ================================================================
        # Shrink given to top-right corner
        given_full = VGroup(given_group, given_box)
        self.play(
            given_full.animate.scale(0.6).to_corner(UR, buff=0.3).shift(DOWN * 0.3),
            run_time=0.5,
        )

        wrong_header = Text(
            "WRONG Interpretation", font_size=32, color=ManimColor(RED),
            weight=BOLD,
        )
        wrong_header.next_to(title_row, DOWN, buff=0.3)
        self.play(Write(wrong_header), run_time=0.5)
        self.wait(0.2)

        wrong_text = Text(
            '"There is a 2.5% chance that lemons\n'
            'weigh more than oranges by 1.5 oz"',
            font_size=22, color=ManimColor(RED),
        )
        wrong_text.next_to(wrong_header, DOWN, buff=0.3)
        self.play(Write(wrong_text), run_time=0.8)
        self.wait(0.5)

        # Draw a cross over the wrong interpretation
        wrong_box = SurroundingRectangle(
            wrong_text, color=ManimColor(RED), buff=0.2,
            corner_radius=0.1, stroke_width=2.5,
        )
        cross_line1 = Line(
            wrong_box.get_corner(UL), wrong_box.get_corner(DR),
            color=ManimColor(RED), stroke_width=5,
        )
        cross_line2 = Line(
            wrong_box.get_corner(UR), wrong_box.get_corner(DL),
            color=ManimColor(RED), stroke_width=5,
        )

        self.play(Create(wrong_box), run_time=0.3)
        self.play(Create(cross_line1), Create(cross_line2), run_time=0.5)
        self.wait(0.5)

        # Show the errors
        error1 = Text(
            "Talks about individual fruits, not sample means",
            font_size=20, color=ManimColor(PINK_3B1B),
        )
        error2 = Text(
            "Doesn't reference samples or sample sizes",
            font_size=20, color=ManimColor(PINK_3B1B),
        )
        errors = VGroup(error1, error2).arrange(DOWN, buff=0.1, aligned_edge=LEFT)
        errors.next_to(wrong_box, DOWN, buff=0.25)

        self.play(Write(error1), run_time=0.5)
        self.play(Write(error2), run_time=0.5)
        self.wait(1.5)

        # Clear wrong section
        wrong_group = VGroup(
            wrong_header, wrong_text, wrong_box,
            cross_line1, cross_line2, errors,
        )
        self.play(FadeOut(wrong_group), run_time=0.4)

        # ================================================================
        #  SECTION 3: CORRECT INTERPRETATION WITH HIGHLIGHTS
        # ================================================================
        correct_header = Text(
            "CORRECT Interpretation", font_size=32,
            color=ManimColor(GREEN_3B1B), weight=BOLD,
        )
        correct_header.next_to(title_row, DOWN, buff=0.3)
        self.play(Write(correct_header), run_time=0.5)
        self.wait(0.2)

        # Build the interpretation as separate highlighted chunks
        c_line1_pre = Text("In about ", font_size=22)
        c_line1_pct = Text("2.5%", font_size=22,
                           color=ManimColor(YELLOW_3B1B), weight=BOLD)
        c_line1_post = Text(" of", font_size=22)
        c_line1 = VGroup(c_line1_pre, c_line1_pct, c_line1_post).arrange(
            RIGHT, buff=0.06,
        )

        c_line2 = Text(
            "all possible pairs of samples",
            font_size=22, color=ManimColor(TEAL_3B1B), weight=BOLD,
        )

        c_line3 = Text(
            "of 6 lemons and 6 oranges,",
            font_size=22, color=ManimColor(BLUE_3B1B), weight=BOLD,
        )

        c_line4_pre = Text("the difference in ", font_size=22)
        c_line4_ctx = Text("sample mean weights", font_size=22,
                           color=ManimColor(GREEN_3B1B), weight=BOLD)
        c_line4 = VGroup(c_line4_pre, c_line4_ctx).arrange(RIGHT, buff=0.06)

        c_line5_pre = Text("would ", font_size=22)
        c_line5_dir = Text("exceed 1.5 oz.", font_size=22,
                           color=ManimColor(PINK_3B1B), weight=BOLD)
        c_line5 = VGroup(c_line5_pre, c_line5_dir).arrange(RIGHT, buff=0.06)

        interp_block = VGroup(
            c_line1, c_line2, c_line3, c_line4, c_line5,
        ).arrange(DOWN, buff=0.16, aligned_edge=LEFT)
        interp_block.next_to(correct_header, DOWN, buff=0.35)

        # Animate line by line
        self.play(Write(c_line1), run_time=0.5)
        self.play(Write(c_line2), run_time=0.5)
        self.play(Write(c_line3), run_time=0.5)
        self.play(Write(c_line4), run_time=0.5)
        self.play(Write(c_line5), run_time=0.5)
        self.wait(0.3)

        # Green surrounding box
        correct_box = SurroundingRectangle(
            interp_block, color=ManimColor(GREEN_3B1B), buff=0.2,
            corner_radius=0.1, stroke_width=2.5,
        )
        self.play(Create(correct_box), run_time=0.4)
        self.wait(0.3)

        # Highlight each key element one by one
        hl_pct = SurroundingRectangle(
            c_line1_pct, color=ManimColor(YELLOW_3B1B), buff=0.05,
            corner_radius=0.05, stroke_width=3,
        )
        hl_pairs = SurroundingRectangle(
            c_line2, color=ManimColor(TEAL_3B1B), buff=0.05,
            corner_radius=0.05, stroke_width=3,
        )
        hl_sizes = SurroundingRectangle(
            c_line3, color=ManimColor(BLUE_3B1B), buff=0.05,
            corner_radius=0.05, stroke_width=3,
        )
        hl_context = SurroundingRectangle(
            c_line4_ctx, color=ManimColor(GREEN_3B1B), buff=0.05,
            corner_radius=0.05, stroke_width=3,
        )
        hl_dir = SurroundingRectangle(
            c_line5_dir, color=ManimColor(PINK_3B1B), buff=0.05,
            corner_radius=0.05, stroke_width=3,
        )

        # Label each element
        lbl_a = Text("(a) Probability value", font_size=16,
                      color=ManimColor(YELLOW_3B1B))
        lbl_b = Text("(b) All possible pairs of samples", font_size=16,
                      color=ManimColor(TEAL_3B1B))
        lbl_c = Text("(c) Sample sizes", font_size=16,
                      color=ManimColor(BLUE_3B1B))
        lbl_d = Text("(d) Context", font_size=16,
                      color=ManimColor(GREEN_3B1B))
        lbl_e = Text("(e) Direction", font_size=16,
                      color=ManimColor(PINK_3B1B))

        labels_col = VGroup(lbl_a, lbl_b, lbl_c, lbl_d, lbl_e).arrange(
            DOWN, buff=0.1, aligned_edge=LEFT,
        )
        labels_col.next_to(correct_box, RIGHT, buff=0.3)
        # If labels go off screen, shift left
        if labels_col.get_right()[0] > 6.5:
            shift_amt = labels_col.get_right()[0] - 6.3
            labels_col.shift(LEFT * shift_amt)

        self.play(Create(hl_pct), FadeIn(lbl_a), run_time=0.4)
        self.wait(0.3)
        self.play(Create(hl_pairs), FadeIn(lbl_b), run_time=0.4)
        self.wait(0.3)
        self.play(Create(hl_sizes), FadeIn(lbl_c), run_time=0.4)
        self.wait(0.3)
        self.play(Create(hl_context), FadeIn(lbl_d), run_time=0.4)
        self.wait(0.3)
        self.play(Create(hl_dir), FadeIn(lbl_e), run_time=0.4)
        self.wait(1.5)

        # Clear correct interpretation
        correct_group = VGroup(
            correct_header, interp_block, correct_box,
            hl_pct, hl_pairs, hl_sizes, hl_context, hl_dir,
            labels_col,
        )
        self.play(FadeOut(correct_group), run_time=0.5)

        # ================================================================
        #  SECTION 4: UNUSUAL VS NOT UNUSUAL — UNUSUAL (2.5%)
        # ================================================================
        unusual_header = Text(
            "Is this result unusual?",
            font_size=34, color=ManimColor(YELLOW_3B1B), weight=BOLD,
        )
        unusual_header.next_to(title_row, DOWN, buff=0.3)
        self.play(Write(unusual_header), run_time=0.5)
        self.wait(0.3)

        # Threshold explanation
        threshold_text = Text(
            "Threshold: probability < 5% (0.05)",
            font_size=24, color=GRAY_B,
        )
        threshold_text.next_to(unusual_header, DOWN, buff=0.25)
        self.play(Write(threshold_text), run_time=0.5)
        self.wait(0.3)

        # Number line 0% to 10%
        nline = NumberLine(
            x_range=[0, 10, 1],
            length=10,
            include_numbers=True,
            numbers_to_include=[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            font_size=20,
            label_direction=DOWN,
        )
        nline.shift(DOWN * 0.3)

        pct_label = Text("%", font_size=18)
        pct_label.next_to(nline.get_right(), RIGHT, buff=0.1)

        self.play(Create(nline), Write(pct_label), run_time=0.6)
        self.wait(0.2)

        # 5% threshold line
        threshold_line = Line(
            nline.n2p(5) + DOWN * 0.3,
            nline.n2p(5) + UP * 0.6,
            color=ManimColor(RED), stroke_width=4,
        )
        threshold_5_label = Text(
            "5%", font_size=20, color=ManimColor(RED), weight=BOLD,
        )
        threshold_5_label.next_to(threshold_line, UP, buff=0.08)

        self.play(Create(threshold_line), Write(threshold_5_label), run_time=0.4)

        # Shade unusual zone (0 to 5)
        unusual_zone = Rectangle(
            width=nline.n2p(5)[0] - nline.n2p(0)[0],
            height=0.3,
            fill_color=ManimColor(RED), fill_opacity=0.2,
            stroke_width=0,
        )
        unusual_zone.move_to(
            (nline.n2p(0) + nline.n2p(5)) / 2 + UP * 0.1,
        )
        unusual_label_zone = Text(
            "UNUSUAL", font_size=16, color=ManimColor(RED),
        )
        unusual_label_zone.move_to(unusual_zone)

        not_unusual_zone_label = Text(
            "NOT UNUSUAL", font_size=16, color=ManimColor(GREEN_3B1B),
        )
        not_unusual_zone_label.move_to(
            (nline.n2p(5) + nline.n2p(10)) / 2 + UP * 0.15,
        )

        self.play(
            FadeIn(unusual_zone), Write(unusual_label_zone),
            Write(not_unusual_zone_label),
            run_time=0.5,
        )
        self.wait(0.3)

        # Mark 2.5%
        dot_25 = Dot(nline.n2p(2.5), color=ManimColor(YELLOW_3B1B), radius=0.12)
        label_25 = Text(
            "2.5%", font_size=22, color=ManimColor(YELLOW_3B1B), weight=BOLD,
        )
        label_25.next_to(dot_25, UP, buff=0.5)
        arrow_25 = Arrow(
            label_25.get_bottom(), dot_25.get_top(),
            buff=0.05, color=ManimColor(YELLOW_3B1B), stroke_width=2,
        )

        self.play(FadeIn(dot_25), Write(label_25), Create(arrow_25), run_time=0.5)
        self.wait(0.3)

        # Verdict
        verdict1 = Text(
            "2.5% < 5%  \u2192  UNUSUAL",
            font_size=26, color=ManimColor(YELLOW_3B1B), weight=BOLD,
        )
        verdict1.next_to(nline, DOWN, buff=0.6)
        self.play(Write(verdict1), run_time=0.5)
        self.wait(0.3)

        meaning = Text(
            "This large a difference would be surprising\n"
            "if sampling from these populations",
            font_size=20, color=GRAY_B,
        )
        meaning.next_to(verdict1, DOWN, buff=0.15)
        self.play(Write(meaning), run_time=0.6)
        self.wait(1.5)

        # Clear unusual section
        unusual_group = VGroup(
            unusual_header, threshold_text,
            nline, pct_label, threshold_line, threshold_5_label,
            unusual_zone, unusual_label_zone, not_unusual_zone_label,
            dot_25, label_25, arrow_25,
            verdict1, meaning,
        )
        self.play(FadeOut(unusual_group), run_time=0.5)

        # ================================================================
        #  SECTION 5: COUNTER-EXAMPLE — NOT UNUSUAL (21.77%)
        # ================================================================
        counter_header = Text(
            "Counter-example: NOT unusual",
            font_size=30, color=ManimColor(GREEN_3B1B), weight=BOLD,
        )
        counter_header.next_to(title_row, DOWN, buff=0.3)
        self.play(Write(counter_header), run_time=0.5)
        self.wait(0.2)

        # New probability
        counter_prob = MathTex(
            r"P(\bar{x}_1 - \bar{x}_2 > 0.8) = 0.2177",
            font_size=30, color=ManimColor(TEAL_3B1B),
        )
        counter_prob.next_to(counter_header, DOWN, buff=0.3)
        self.play(Write(counter_prob), run_time=0.6)
        self.wait(0.3)

        # Quick number line
        nline2 = NumberLine(
            x_range=[0, 25, 5],
            length=10,
            include_numbers=True,
            numbers_to_include=[0, 5, 10, 15, 20, 25],
            font_size=20,
            label_direction=DOWN,
        )
        nline2.shift(DOWN * 0.3)

        pct2 = Text("%", font_size=18)
        pct2.next_to(nline2.get_right(), RIGHT, buff=0.1)

        self.play(Create(nline2), Write(pct2), run_time=0.5)

        # 5% threshold
        thresh2 = Line(
            nline2.n2p(5) + DOWN * 0.3,
            nline2.n2p(5) + UP * 0.5,
            color=ManimColor(RED), stroke_width=4,
        )
        thresh2_label = Text("5%", font_size=18, color=ManimColor(RED), weight=BOLD)
        thresh2_label.next_to(thresh2, UP, buff=0.08)
        self.play(Create(thresh2), Write(thresh2_label), run_time=0.3)

        # Shade unusual zone
        uzone2 = Rectangle(
            width=nline2.n2p(5)[0] - nline2.n2p(0)[0],
            height=0.3,
            fill_color=ManimColor(RED), fill_opacity=0.2,
            stroke_width=0,
        )
        uzone2.move_to((nline2.n2p(0) + nline2.n2p(5)) / 2 + UP * 0.1)
        self.play(FadeIn(uzone2), run_time=0.3)

        # Mark 21.77%
        dot_2177 = Dot(nline2.n2p(21.77), color=ManimColor(GREEN_3B1B), radius=0.12)
        label_2177 = Text(
            "21.77%", font_size=22, color=ManimColor(GREEN_3B1B), weight=BOLD,
        )
        label_2177.next_to(dot_2177, UP, buff=0.15)

        self.play(FadeIn(dot_2177), Write(label_2177), run_time=0.5)
        self.wait(0.3)

        verdict2 = Text(
            "21.77% > 5%  \u2192  NOT UNUSUAL",
            font_size=26, color=ManimColor(GREEN_3B1B), weight=BOLD,
        )
        verdict2.next_to(nline2, DOWN, buff=0.6)
        self.play(Write(verdict2), run_time=0.5)
        self.wait(0.3)

        # Brief correct interpretation
        counter_interp = Text(
            "In about 21.77% of all possible pairs of samples\n"
            "of 6 lemons and 6 oranges, the difference in\n"
            "sample mean weights would exceed 0.8 oz.",
            font_size=18, color=GRAY_B,
        )
        counter_interp.next_to(verdict2, DOWN, buff=0.15)
        self.play(Write(counter_interp), run_time=0.8)
        self.wait(1.5)

        # Clear counter-example
        counter_group = VGroup(
            counter_header, counter_prob,
            nline2, pct2, thresh2, thresh2_label, uzone2,
            dot_2177, label_2177, verdict2, counter_interp,
        )
        self.play(FadeOut(counter_group), FadeOut(given_full), run_time=0.5)

        # ================================================================
        #  SECTION 6: SUMMARY CHECKLIST
        # ================================================================
        self.play(FadeOut(title_row), run_time=0.3)

        checklist_title = Text(
            "Interpretation Checklist",
            font_size=34, color=ManimColor(GOLD), weight=BOLD,
        )

        check_items = VGroup()
        checklist_data = [
            ("Include probability/percentage value", YELLOW_3B1B),
            ('Reference "all possible pairs of\nsamples of size n\u2081 and n\u2082"', TEAL_3B1B),
            ("Use context (specific populations, units)", GREEN_3B1B),
            ("State direction (greater/less than value)", PINK_3B1B),
            ("Classify: unusual (< 5%) or not unusual (\u2265 5%)", GOLD),
        ]

        for text, color in checklist_data:
            check_mark = Text(
                "\u2713", font_size=26, color=ManimColor(color), weight=BOLD,
            )
            item_text = Text(text, font_size=20)
            row = VGroup(check_mark, item_text).arrange(RIGHT, buff=0.15)
            check_items.add(row)

        check_items.arrange(DOWN, buff=0.2, aligned_edge=LEFT)

        checklist_group = VGroup(checklist_title, check_items).arrange(
            DOWN, buff=0.3, aligned_edge=LEFT,
        )
        checklist_group.move_to(ORIGIN)

        checklist_box = SurroundingRectangle(
            checklist_group, color=ManimColor(GOLD), buff=0.3,
            corner_radius=0.15, stroke_width=3,
        )

        self.play(Write(checklist_title), run_time=0.5)
        self.wait(0.2)

        for item in check_items:
            self.play(FadeIn(item, shift=RIGHT * 0.2), run_time=0.4)
            self.wait(0.15)

        self.play(Create(checklist_box), run_time=0.5)
        self.wait(2.5)

        # ================================================================
        #  FADE OUT
        # ================================================================
        self.play(
            *[FadeOut(mob) for mob in self.mobjects],
        )
        self.wait(0.5)
