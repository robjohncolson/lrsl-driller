"""
Topic 6.3 Capstone Synthesis (AP Stats Unit 6, Topic 6.3)

Ties together all concepts from Topic 6.3: interpreting CIs, justifying
claims, confidence level meaning, and factors affecting ME. Walks through
the complete CI process (State-Plan-Do-Conclude) with a worked example,
then presents a final summary checklist.

Run with: manim -qm --format=mp4 apstat_63_capstone.py Capstone63
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class Capstone63(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ================================================================
        # TITLE
        # ================================================================
        title = Text("Topic 6.3 Capstone: The Full CI Process", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ================================================================
        # THE 4-STEP PROCESS OVERVIEW
        # ================================================================
        steps_header = Text(
            "Constructing & Interpreting a CI for p",
            font_size=26, color=YELLOW_3B1B, weight=BOLD,
        )
        steps_header.next_to(title, DOWN, buff=0.3)
        self.play(Write(steps_header), run_time=0.5)

        step_colors = [PINK_3B1B, BLUE_3B1B, TEAL_3B1B, GREEN_3B1B]
        step_labels = [
            "1. State: Define parameter + identify procedure",
            "2. Plan: Check conditions (Random, 10%, Large Counts)",
            "3. Do: Calculate the confidence interval",
            "4. Conclude: Interpret in context + justify claim",
        ]

        steps_group = VGroup()
        for i, (label, color) in enumerate(zip(step_labels, step_colors)):
            step = Text(label, font_size=21, color=color)
            steps_group.add(step)
        steps_group.arrange(DOWN, aligned_edge=LEFT, buff=0.14)
        steps_group.next_to(steps_header, DOWN, buff=0.2)

        for step in steps_group:
            self.play(Write(step), run_time=0.5)
            self.wait(0.15)
        self.wait(0.5)

        steps_box = SurroundingRectangle(
            VGroup(steps_header, steps_group),
            color=YELLOW_3B1B, buff=0.2, corner_radius=0.1,
        )
        self.play(Create(steps_box), run_time=0.5)
        self.wait(0.8)

        # ================================================================
        # TRANSITION: Clear overview, begin worked example
        # ================================================================
        self.play(
            FadeOut(steps_header), FadeOut(steps_group), FadeOut(steps_box),
            run_time=0.5,
        )

        # ================================================================
        # WORKED EXAMPLE
        # ================================================================
        ex_header = Text(
            "Example: Music Player (AP 2010 B #4)",
            font_size=26, color=YELLOW_3B1B, weight=BOLD,
        )
        ex_header.next_to(title, DOWN, buff=0.3)
        self.play(Write(ex_header), run_time=0.5)

        context = VGroup(
            Text("2,384 songs loaded, 13 of 50 sampled were Lori's", font_size=20),
            Text("Construct a 90% CI for p = proportion loaded by Lori", font_size=20, color=TEAL_3B1B),
        ).arrange(DOWN, buff=0.08)
        context.next_to(ex_header, DOWN, buff=0.2)
        self.play(Write(context), run_time=0.7)
        self.wait(0.4)

        # STEP 1: State
        s1_header = Text("Step 1: State", font_size=22, color=PINK_3B1B, weight=BOLD)
        s1_content = VGroup(
            Text("Parameter: p = proportion of all songs loaded by Lori", font_size=18),
            Text("Procedure: One-sample z-interval for p", font_size=18),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.06)
        s1 = VGroup(s1_header, s1_content).arrange(DOWN, aligned_edge=LEFT, buff=0.08)
        s1.next_to(context, DOWN, buff=0.25)
        self.play(Write(s1), run_time=0.8)
        self.wait(0.3)

        # STEP 2: Plan (conditions)
        s2_header = Text("Step 2: Plan (Conditions)", font_size=22, color=BLUE_3B1B, weight=BOLD)
        s2_content = VGroup(
            Text("Random: random sample of songs (stated)", font_size=18),
            MathTex(r"\text{10\%: } 50 \leq 0.10 \times 2384 = 238.4 \;\checkmark", font_size=22),
            MathTex(r"\text{Large Counts: } 13 \geq 10 \;\checkmark,\; 37 \geq 10 \;\checkmark", font_size=22),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.06)
        s2 = VGroup(s2_header, s2_content).arrange(DOWN, aligned_edge=LEFT, buff=0.08)
        s2.next_to(s1, DOWN, buff=0.2)
        self.play(Write(s2), run_time=1.0)
        self.wait(0.3)

        # STEP 3: Do (calculate)
        s3_header = Text("Step 3: Do (Calculate)", font_size=22, color=TEAL_3B1B, weight=BOLD)
        s3_content = VGroup(
            MathTex(r"\hat{p} = 13/50 = 0.26", font_size=24, color=TEAL_3B1B),
            MathTex(
                r"0.26 \pm 1.645\sqrt{\frac{0.26(0.74)}{50}}",
                font_size=24,
            ),
            MathTex(r"= 0.26 \pm 0.102 = (0.158,\; 0.362)", font_size=24, color=GREEN_3B1B),
        ).arrange(DOWN, buff=0.06)
        s3 = VGroup(s3_header, s3_content).arrange(DOWN, aligned_edge=LEFT, buff=0.08)
        s3.next_to(s2, DOWN, buff=0.2)
        self.play(Write(s3), run_time=1.2)
        self.wait(0.5)

        # ================================================================
        # TRANSITION: Clear steps 1-3, show step 4
        # ================================================================
        self.play(
            FadeOut(ex_header), FadeOut(context),
            FadeOut(s1), FadeOut(s2), FadeOut(s3),
            run_time=0.5,
        )

        # STEP 4: Conclude
        s4_header = Text("Step 4: Conclude", font_size=28, color=GREEN_3B1B, weight=BOLD)
        s4_header.next_to(title, DOWN, buff=0.35)
        self.play(Write(s4_header), run_time=0.4)

        # Interpretation
        interp_label = Text("Interpretation:", font_size=22, color=YELLOW_3B1B, weight=BOLD)
        interp_label.next_to(s4_header, DOWN, buff=0.25)
        interp_text = VGroup(
            Text("\"We are 90% confident that the interval from", font_size=20),
            Text("0.158 to 0.362 captures the proportion of all", font_size=20),
            Text("songs loaded by Lori.\"", font_size=20),
        ).arrange(DOWN, buff=0.05)
        interp_text.next_to(interp_label, DOWN, buff=0.1)
        interp_box = SurroundingRectangle(
            interp_text, color=GREEN_3B1B, buff=0.15, corner_radius=0.08,
        )

        self.play(Write(interp_label), run_time=0.3)
        self.play(Write(interp_text), run_time=1.0)
        self.play(Create(interp_box), run_time=0.4)
        self.wait(0.5)

        # Confidence level reminder
        cl_reminder = VGroup(
            Text("Confidence level meaning:", font_size=20, color=BLUE_3B1B, weight=BOLD),
            Text("If we took many samples and built many CIs,", font_size=18),
            Text("about 90% would capture the true proportion.", font_size=18),
        ).arrange(DOWN, buff=0.05)
        cl_reminder.next_to(interp_box, DOWN, buff=0.3)
        self.play(Write(cl_reminder), run_time=0.8)
        self.wait(0.5)

        # Claim justification
        claim_label = Text("Justify a claim:", font_size=20, color=PINK_3B1B, weight=BOLD)
        claim_label.next_to(cl_reminder, DOWN, buff=0.25)
        claim_text = VGroup(
            Text("\"Does Lori have more than 20% of the songs?\"", font_size=18, color=GREY_B),
            Text("Since 0.20 is below 0.158, ALL values > 0.20.", font_size=18),
            Text("--> Convincing evidence Lori has > 20%", font_size=18, color=GREEN_3B1B),
        ).arrange(DOWN, buff=0.05)
        claim_text.next_to(claim_label, DOWN, buff=0.1)
        self.play(Write(claim_label), Write(claim_text), run_time=0.8)
        self.wait(0.8)

        # ================================================================
        # FINAL CHECKLIST
        # ================================================================
        self.play(
            FadeOut(s4_header), FadeOut(interp_label), FadeOut(interp_text),
            FadeOut(interp_box), FadeOut(cl_reminder),
            FadeOut(claim_label), FadeOut(claim_text),
            FadeOut(title),
            run_time=0.5,
        )

        final_content = VGroup(
            Text("Topic 6.3 Checklist", font_size=34, color=YELLOW_3B1B, weight=BOLD),
            Text("", font_size=8),
            Text("1. Define parameter + identify procedure", font_size=22, color=PINK_3B1B),
            Text("2. Check: Random, 10%, Large Counts", font_size=22, color=BLUE_3B1B),
            Text("3. Calculate CI: p-hat +/- z* * SE", font_size=22, color=TEAL_3B1B),
            Text("4. Interpret: 'We are C% confident...'", font_size=22, color=GREEN_3B1B),
            Text("5. Justify claim: ALL values consistent?", font_size=22, color=GREEN_3B1B),
            Text("", font_size=6),
            Text("Confidence = repeated sampling (NOT probability)", font_size=20, color=RED),
            Text("Larger n or lower C% --> Smaller ME", font_size=20, color=YELLOW_3B1B),
        ).arrange(DOWN, buff=0.1)
        final_content.move_to(ORIGIN)

        final_box = SurroundingRectangle(
            final_content, color=YELLOW_3B1B, buff=0.3, corner_radius=0.15,
        )

        self.play(
            LaggedStart(
                *[Write(line) for line in final_content],
                lag_ratio=0.15,
            ),
            run_time=2.8,
        )
        self.play(Create(final_box), run_time=0.5)
        self.wait(2.5)
