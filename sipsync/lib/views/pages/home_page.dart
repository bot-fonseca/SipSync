import 'package:flutter/material.dart';
import 'package:percent_indicator/circular_percent_indicator.dart';
import 'package:wave/config.dart';
import 'package:wave/wave.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int goal = 2000;
  int current = 1000;
  @override
  Widget build(BuildContext context) {
    double percent = (current / goal).clamp(0.0, 1.0);
    DateTime now = DateTime.now();
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 20),
      child: SingleChildScrollView(
        child: Column(
          children: [
            Row(
              children: [
                //parte de cima avatar e nome
                CircleAvatar(
                  radius: 30,
                  backgroundImage: AssetImage('assets/images/water2.jpg'),
                ),
                SizedBox(width: 10),
                Text('${sayGood(now.hour)}, user'), //nome do user em falta
              ],
            ),
            SizedBox(height: 50),

            //parte do meio o circulo
            CircularPercentIndicator(
              radius: 125.0,
              lineWidth: 10.0,
              animation: true,
              animationDuration: 10000,
              percent: percent,
              circularStrokeCap: CircularStrokeCap.round,
              animateFromLastPercent: true,
              progressColor: Colors.blueAccent,
              center: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SizedBox(height: 10),
                  ClipOval(
                    child: SizedBox(
                      width: 190,
                      height: 190,
                      child: WaveWidget(
                        config: CustomConfig(
                          gradients: [
                            [
                              Colors.blueAccent,
                              const Color.fromARGB(255, 96, 205, 255),
                            ],
                            [
                              const Color.fromARGB(255, 12, 116, 202),
                              Colors.blueAccent,
                            ],
                          ],
                          durations: [100000, 80000],
                          heightPercentages: [
                            1.0 - percent,
                            1.0 - percent + 0.02,
                          ],
                          blur: const MaskFilter.blur(BlurStyle.solid, 2),
                          gradientBegin: Alignment.bottomLeft,
                          gradientEnd: Alignment.topRight,
                        ),
                        waveAmplitude: 10,
                        backgroundColor: Colors.transparent,
                        size: const Size(double.infinity, double.infinity),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            //parte de adicionar e remover agua
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton(
                  color: Colors.blueAccent,
                  iconSize: 35,
                  onPressed: () => spitWater(250),
                  icon: Icon(Icons.remove),
                ),
                SizedBox(width: 20),
                Text(
                  "$current / $goal ml",
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.blue,
                  ),
                ),
                SizedBox(width: 20),
                IconButton(
                  color: Colors.blueAccent,
                  iconSize: 35,
                  onPressed: () => drinkWater(250),
                  icon: Icon(Icons.add),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String sayGood(int hour) {
    if (hour < 12) {
      return 'Good morning';
    } else if (hour < 18) {
      return 'Good afternoon';
    } else {
      return 'Good evening';
    }
  }

  void drinkWater(int amount) {
    setState(() {
      current += amount;
      if (current > goal) {
        current = goal;//tem de ser alterado porque podem beber mais que o goal
      }
    });
  }

  void spitWater(int amount) {
    setState(() {
      current -= amount;
      if (current < 0) {
        current = 0;
      }
    });
  }
}
