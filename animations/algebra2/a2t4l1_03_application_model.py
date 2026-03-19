"""
Level 3: Inverse Variation Applications
Model real-world inverse variation: find k from a given pair, solve for the unknown.

Run with: python -m manim -qm --format=mp4 a2t4l1_03_application_model.py InverseApplicationScene
"""
from manim import *


class InverseApplicationScene(Scene):
    def construct(self):
        self.scene_1_problem_setup()
        self.scene_2_find_k()
        self.scene_3_solve_unknown()
        self.scene_4_hyperbola_graph()
        self.scene_5_process_box()

    # ── Scene 1: Problem Setup (~8 s) ────────────────────────────────
    def scene_1_problem_setup(self):
        title = Text("Inverse Variation Application", font_size=42)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.3)

        # Problem statement
        problem = Text(
            "4 workers can paint a room in 18 hours.",
            font_size=30,
            color=WHITE,
        )
        problem.next_to(title, DOWN, buff=0.5)
        self.play(Write(problem), run_time=1.5)
        self.wait(0.5)

        # Caption: reference to L01-L02
        caption = Text(
            "Recall: xy = k  and  y = k/x",
            font_size=22,
            color=GRAY,
        )
        caption.next_to(problem, DOWN, buff=0.3)
        self.play(FadeIn(caption, shift=UP * 0.15), run_time=0.6)
        self.wait(0.4)

        # Visual: 4 worker dots in BLUE
        worker_dots = VGroup()
        for i in range(4):
            dot = Dot(radius=0.18, color=BLUE)
            dot.shift(LEFT * 2.5 + DOWN * 0.8 + RIGHT * i * 0.7)
            worker_dots.add(dot)

        w_label = MathTex(r"w = 4", font_size=34, color=BLUE)
        w_label.next_to(worker_dots, DOWN, buff=0.3)

        # Time in YELLOW
        t_label = MathTex(r"t = 18 \text{ hrs}", font_size=34, color=YELLOW)
        t_label.shift(RIGHT * 2.5 + DOWN * 1.0)

        self.play(
            LaggedStart(*[GrowFromCenter(d) for d in worker_dots], lag_ratio=0.15),
            Write(w_label),
            run_time=1.2,
        )
        self.play(Write(t_label), run_time=0.8)
        self.wait(0.4)

        # Insight: More workers -> Less time
        insight = Text("More workers  \u2192  Less time", font_size=28, color=GREEN)
        insight.shift(DOWN * 2.5)
        arrow_up = MathTex(r"\uparrow", font_size=36, color=BLUE)
        arrow_down = MathTex(r"\downarrow", font_size=36, color=YELLOW)
        arrow_up.next_to(insight, LEFT, buff=0.3)
        arrow_down.next_to(insight, RIGHT, buff=0.3)

        self.play(Write(insight), Write(arrow_up), Write(arrow_down))
        self.wait(1.0)

        # Store for cleanup
        self.title = title
        self.scene_1_mobs = VGroup(
            problem, caption, worker_dots, w_label,
            t_label, insight, arrow_up, arrow_down,
        )

    # ── Scene 2: Find k (~8 s) ───────────────────────────────────────
    def scene_2_find_k(self):
        self.play(FadeOut(self.scene_1_mobs), run_time=0.7)

        subtitle = Text("Step 1: Find the constant k", font_size=30, color=GREEN)
        subtitle.next_to(self.title, DOWN, buff=0.5)
        self.play(Write(subtitle))
        self.wait(0.3)

        # General model: w * t = k
        model = MathTex(r"w", r"\cdot", r"t", r"=", r"k", font_size=42)
        model[0].set_color(BLUE)
        model[2].set_color(YELLOW)
        model[4].set_color(GREEN)
        model.shift(UP * 0.5)
        self.play(Write(model), run_time=1.0)
        self.wait(0.5)

        # Substitute known values
        plug_in = MathTex(r"4", r"\times", r"18", r"=", r"k", font_size=42)
        plug_in[0].set_color(BLUE)
        plug_in[2].set_color(YELLOW)
        plug_in[4].set_color(GREEN)
        plug_in.shift(DOWN * 0.3)
        self.play(Write(plug_in), run_time=0.8)
        self.wait(0.5)

        # Result: k = 72
        k_result = MathTex(r"k", r"=", r"72", font_size=48, color=GREEN)
        k_result.shift(DOWN * 1.3)
        self.play(Write(k_result), run_time=0.7)
        self.play(Circumscribe(k_result, color=GREEN, run_time=0.8))
        self.wait(0.3)

        # Write the equation
        equation = MathTex(r"t", r"=", r"\frac{72}{w}", font_size=44)
        equation[0].set_color(YELLOW)
        equation[2].set_color(GREEN)
        equation.shift(DOWN * 2.4)
        self.play(Write(equation), run_time=0.8)
        self.wait(1.0)

        # Store for cleanup
        self.scene_2_mobs = VGroup(subtitle, model, plug_in, k_result, equation)

    # ── Scene 3: Solve for Unknown (~8 s) ─────────────────────────────
    def scene_3_solve_unknown(self):
        self.play(FadeOut(self.scene_2_mobs), run_time=0.7)

        subtitle = Text("Step 2: Solve for the unknown", font_size=30, color=GOLD)
        subtitle.next_to(self.title, DOWN, buff=0.5)
        self.play(Write(subtitle))
        self.wait(0.3)

        question = Text("How long for 6 workers?", font_size=32, color=WHITE)
        question.shift(UP * 0.8)
        self.play(Write(question))
        self.wait(0.4)

        # Show 6 worker dots
        six_dots = VGroup()
        for i in range(6):
            dot = Dot(radius=0.16, color=BLUE)
            dot.shift(LEFT * 1.5 + RIGHT * i * 0.5 + UP * 0.1)
            six_dots.add(dot)

        self.play(
            LaggedStart(*[GrowFromCenter(d) for d in six_dots], lag_ratio=0.1),
            run_time=0.8,
        )
        self.wait(0.3)

        # Step-by-step substitution
        step1 = MathTex(r"t", r"=", r"\frac{72}{w}", font_size=40)
        step1[0].set_color(YELLOW)
        step1[2].set_color(GREEN)
        step1.shift(DOWN * 0.6)

        step2 = MathTex(r"t", r"=", r"\frac{72}{6}", font_size=40)
        step2[0].set_color(YELLOW)
        step2[2][0:2].set_color(GREEN)   # "72"
        step2[2][3].set_color(BLUE)      # "6"
        step2.shift(DOWN * 0.6)

        result = MathTex(r"t", r"=", r"12", r"\text{ hours}", font_size=44)
        result[0].set_color(YELLOW)
        result[2].set_color(GOLD)
        result[3].set_color(GOLD)
        result.shift(DOWN * 1.5)

        self.play(Write(step1), run_time=0.7)
        self.wait(0.4)
        self.play(TransformMatchingTex(step1, step2), run_time=0.8)
        self.wait(0.4)
        self.play(Write(result), run_time=0.8)

        # Highlight the answer
        answer_box = SurroundingRectangle(result, color=GOLD, buff=0.15)
        self.play(Create(answer_box))
        self.play(
            answer_box.animate.set_stroke(width=6),
            rate_func=there_and_back,
            run_time=0.6,
        )
        self.wait(1.0)

        # Store for cleanup
        self.scene_3_mobs = VGroup(
            subtitle, question, six_dots, step2, result, answer_box,
        )

    # ── Scene 4: Hyperbola Graph (~10 s) ──────────────────────────────
    def scene_4_hyperbola_graph(self):
        self.play(FadeOut(self.scene_3_mobs), run_time=0.7)

        graph_title = Text("The Inverse Variation Curve", font_size=30)
        graph_title.next_to(self.title, DOWN, buff=0.4)
        self.play(Write(graph_title))

        # Axes
        axes = Axes(
            x_range=[0, 10, 1],
            y_range=[0, 25, 5],
            x_length=6,
            y_length=4.5,
            axis_config={"include_numbers": True, "font_size": 22},
            tips=False,
        )
        axes.shift(DOWN * 0.4)

        x_label = axes.get_x_axis_label(
            Text("workers", font_size=22, color=BLUE), edge=DOWN, direction=DOWN
        )
        y_label = axes.get_y_axis_label(
            Text("hours", font_size=22, color=YELLOW), edge=LEFT, direction=LEFT
        )

        self.play(Create(axes), Write(x_label), Write(y_label), run_time=1.2)
        self.wait(0.3)

        # Plot t = 72/w for w in [3, 9]
        curve = axes.plot(
            lambda w: 72 / w,
            x_range=[3, 9],
            color=YELLOW,
            stroke_width=3,
        )
        self.play(Create(curve), run_time=1.5)
        self.wait(0.3)

        # Point 1: (4, 18) in BLUE
        point1 = Dot(axes.c2p(4, 18), radius=0.1, color=BLUE)
        label1 = MathTex(r"(4, 18)", font_size=26, color=BLUE)
        label1.next_to(point1, UR, buff=0.15)

        # Point 2: (6, 12) in GOLD
        point2 = Dot(axes.c2p(6, 12), radius=0.1, color=GOLD)
        label2 = MathTex(r"(6, 12)", font_size=26, color=GOLD)
        label2.next_to(point2, UR, buff=0.15)

        self.play(GrowFromCenter(point1), Write(label1))
        self.wait(0.3)
        self.play(GrowFromCenter(point2), Write(label2))
        self.wait(0.5)

        # Dashed line projections from each point to axes
        dash1_x = DashedLine(
            axes.c2p(4, 0), axes.c2p(4, 18), color=BLUE, stroke_width=1.5
        )
        dash1_y = DashedLine(
            axes.c2p(0, 18), axes.c2p(4, 18), color=BLUE, stroke_width=1.5
        )
        dash2_x = DashedLine(
            axes.c2p(6, 0), axes.c2p(6, 12), color=GOLD, stroke_width=1.5
        )
        dash2_y = DashedLine(
            axes.c2p(0, 12), axes.c2p(6, 12), color=GOLD, stroke_width=1.5
        )

        self.play(
            Create(dash1_x), Create(dash1_y),
            Create(dash2_x), Create(dash2_y),
            run_time=0.8,
        )
        self.wait(1.0)

        # Store for cleanup
        self.scene_4_mobs = VGroup(
            graph_title, axes, x_label, y_label, curve,
            point1, label1, point2, label2,
            dash1_x, dash1_y, dash2_x, dash2_y,
        )

    # ── Scene 5: Boxed Process Summary (~4 s) ─────────────────────────
    def scene_5_process_box(self):
        self.play(FadeOut(self.scene_4_mobs), run_time=0.7)

        summary_title = Text("Solving Inverse Variation Problems", font_size=30)
        summary_title.next_to(self.title, DOWN, buff=0.5)
        self.play(Write(summary_title))
        self.wait(0.3)

        process = VGroup(
            MathTex(
                r"\textbf{1.}", r"\text{ Find }", r"k", r"=",
                r"x_1", r"\cdot", r"y_1",
                font_size=34,
            ),
            MathTex(
                r"\textbf{2.}", r"\text{ Solve: }", r"y_2", r"=",
                r"\frac{k}{x_2}",
                font_size=34,
            ),
        ).arrange(DOWN, buff=0.5, aligned_edge=LEFT)
        process.shift(DOWN * 0.5)

        # Color the symbols
        process[0][2].set_color(GREEN)     # k
        process[0][4].set_color(BLUE)      # x_1
        process[0][6].set_color(YELLOW)    # y_1
        process[1][2].set_color(YELLOW)    # y_2
        process[1][4][0].set_color(GREEN)  # k in fraction
        process[1][4][2:].set_color(BLUE)  # x_2 in fraction

        box = SurroundingRectangle(
            process, color=WHITE, buff=0.25, corner_radius=0.1
        )

        self.play(Write(process[0]), run_time=1.0)
        self.wait(0.3)
        self.play(Write(process[1]), run_time=1.0)
        self.play(Create(box))
        self.wait(0.5)

        # Key reminder
        reminder = Text(
            "The product x \u00b7 y is always constant!",
            font_size=24,
            color=GREEN,
        )
        reminder.next_to(box, DOWN, buff=0.4)
        self.play(Write(reminder))
        self.wait(2.0)
